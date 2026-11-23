# Payment production checks — READ ONLY, UNEXECUTED

Do not run against production or preview from this pull request. These queries
only read data; they do not write, index, or migrate anything. Run them with a
reviewer present and attach the output to the release ticket.

## 1. Booking status vocabulary

Counts every observed pair, so legacy or unknown values appear instead of being
silently filtered out.

```js
// mongosh
use(<production-database-name>);

db.bookings.aggregate([
  {
    $group: {
      _id: { status: "$status", paymentStatus: "$paymentStatus" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

Expected vocabulary after both pull requests:

- booking `status`: `pending`, `confirmed`, `rejected`, `completed`, `cancelled`
- booking `paymentStatus`: `awaiting_payment`, `awaiting_verification`, `confirmed`, `cancelled`

Anything else is a migration candidate. Do not update it before the plan is
reviewed.

## 2. Transaction status vocabulary

```js
// mongosh — read only
db.transactions.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

db.transactions.aggregate([
  {
    $group: {
      _id: {
        status: "$status",
        gateway: "$paymentGateway",
        refundStatus: "$refundStatus"
      },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

## 3. Bookings awaiting verification without evidence

```js
// mongosh — read only
db.bookings.aggregate([
  {
    $match: {
      paymentStatus: "awaiting_verification",
      $or: [
        { receiptImageUrl: null },
        { receiptImageUrl: "" },
        { receiptImageUrl: { $exists: false } }
      ]
    }
  },
  {
    $group: {
      _id: { provider: "$provider", paymentMethod: "$paymentMethod" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

These bookings cannot be verified until a receipt exists or a cash
acknowledgment is recorded.

## 4. Providers without usable transfer bank details

A provider is counted when either the account number or account name is missing
or blank.

```js
// mongosh — read only
db.users.aggregate([
  {
    $match: {
      role: "provider",
      $or: [
        { "bankAccount.accountNumber": { $in: [null, ""] } },
        { "bankAccount.accountNumber": { $exists: false } },
        { "bankAccount.accountName": { $in: [null, ""] } },
        { "bankAccount.accountName": { $exists: false } }
      ]
    }
  },
  {
    $project: {
      businessName: 1,
      email: 1,
      hasAccountNumber: {
        $cond: [
          { $gt: [{ $strLenCP: { $ifNull: ["$bankAccount.accountNumber", ""] } }, 0] },
          true,
          false
        ]
      },
      hasAccountName: {
        $cond: [
          { $gt: [{ $strLenCP: { $ifNull: ["$bankAccount.accountName", ""] } }, 0] },
          true,
          false
        ]
      },
      transferEnabled: "$paymentMethods.transfer",
      cashEnabled: "$paymentMethods.cash"
    }
  },
  { $sort: { businessName: 1 } }
]);
```

## 5. Verified amounts that differ from the transaction amount

```js
// mongosh — read only
db.transactions.aggregate([
  {
    $match: {
      status: "successful",
      $expr: { $ne: ["$amountReceived", "$amount"] }
    }
  },
  {
    $project: {
      booking: 1,
      amount: 1,
      amountReceived: 1,
      verifiedAt: 1,
      overrideReason: 1
    }
  },
  { $limit: 200 }
]);
```

Review these against the booking's `verificationOverrideReason`; an override is
expected for an intentional partial payment.
