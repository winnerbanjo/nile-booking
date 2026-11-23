# Availability production checks — READ ONLY, UNEXECUTED

Do not run against production or preview from this pull request. These queries
only read data; they do not write, index, or migrate anything. Run them with a
reviewer present and paste the counts into the release ticket.

## 1. Active bookings missing canonical times

```js
// mongosh
use(<production-database-name>);

db.bookings.aggregate([
  {
    $match: {
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: new Date() },
      $or: [
        { startAt: null },
        { endAt: null },
        { startAt: { $exists: false } },
        { endAt: { $exists: false } }
      ]
    }
  },
  {
    $group: {
      _id: { provider: "$provider", status: "$status" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

## 2. Active bookings without a claim

```js
// mongosh — read only
db.bookings.aggregate([
  {
    $match: {
      status: { $in: ["pending", "confirmed"] },
      startAt: { $ne: null },
      endAt: { $ne: null }
    }
  },
  {
    $lookup: {
      from: "slotclaims",
      localField: "_id",
      foreignField: "booking",
      as: "claims"
    }
  },
  { $match: { claims: { $size: 0 } } },
  { $count: "activeBookingsWithoutClaims" }
]);
```

## 3. Overlapping active intervals

This is a report, not a constraint. It lists every pair that would collide if
both were claimed. Review provider by provider.

```js
// mongosh — read only
db.bookings.aggregate([
  {
    $match: {
      status: { $in: ["pending", "confirmed"] },
      startAt: { $ne: null },
      endAt: { $ne: null }
    }
  },
  { $sort: { provider: 1, startAt: 1 } },
  {
    $group: {
      _id: "$provider",
      bookings: {
        $push: {
          id: "$_id",
          bookingNumber: "$bookingNumber",
          status: "$status",
          startAt: "$startAt",
          endAt: "$endAt"
        }
      }
    }
  },
  {
    $project: {
      overlaps: {
        $filter: {
          input: {
            $map: {
              input: { $range: [0, { $size: "$bookings" }] },
              as: "i",
              in: {
                $let: {
                  vars: { current: { $arrayElemAt: ["$bookings", "$$i"] } },
                  in: {
                    $map: {
                      input: {
                        $filter: {
                          input: {
                            $slice: [
                              "$bookings",
                              { $add: ["$$i", 1] },
                              { $size: "$bookings" }
                            ]
                          },
                          as: "later",
                          cond: {
                            $and: [
                              { $lt: ["$$later.startAt", "$$current.endAt"] },
                              { $gt: ["$$later.endAt", "$$current.startAt"] }
                            ]
                          }
                        }
                      },
                      as: "other",
                      in: {
                        bookingNumber: "$$current.bookingNumber",
                        otherBookingNumber: "$$other.bookingNumber",
                        startAt: "$$current.startAt",
                        endAt: "$$current.endAt",
                        otherStartAt: "$$other.startAt",
                        otherEndAt: "$$other.endAt"
                      }
                    }
                  }
                }
              }
            }
          },
          as: "pair",
          cond: { $gt: [{ $size: "$$pair" }, 0] }
        }
      }
    }
  },
  { $match: { "overlaps.0": { $exists: true } } }
]);
```

## 4. Claim index and expiry counts

```js
// mongosh — read only
db.slotclaims.getIndexes();
db.slotclaims.aggregate([
  {
    $group: {
      _id: {
        status: "$status",
        expired: {
          $cond: [{ $lte: ["$expiresAt", new Date()] }, true, false]
        }
      },
      count: { $sum: 1 }
    }
  }
]);
```

Interpretation: expired `held` claims are cleared by `POST /api/availability/sweep`
(or by the lazy provider sweep). They are not removed by a TTL index.
