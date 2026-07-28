import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import slugify from 'slugify';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('Usage: node migrateCategories.js [--dry-run | --execute]');
  process.exit(1);
}

const safeNormalize = (name) => name.trim().toLowerCase();

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to MongoDB. Mode: ${isDryRun ? 'DRY-RUN' : 'EXECUTE'}`);

    const services = await Service.find({});
    
    const affectedMerchants = new Set();
    const categoriesToCreate = new Map(); // merchantId -> Map(normalizedName -> originalName)
    const categoryMapIds = new Map(); // merchantId_normalizedName -> categoryId
    
    let totalServicesScanned = services.length;
    let servicesLinked = 0;
    let servicesLeftUncategorized = 0;
    let invalidRecords = 0;
    let alreadyMigrated = 0;

    // Step 1: Scan services
    for (const service of services) {
      if (!service.provider) {
        invalidRecords++;
        console.warn(`[WARNING] Service ${service._id} has no provider.`);
        continue;
      }
      const merchantId = service.provider.toString();

      if (service.categoryId) {
        alreadyMigrated++;
        continue;
      }

      let catName = (service.category || '').trim();
      
      const uncategorizedKeywords = ['other', 'others', 'uncategorised', 'uncategorized', 'none', 'n/a', ''];
      
      if (uncategorizedKeywords.includes(catName.toLowerCase())) {
        servicesLeftUncategorized++;
        continue;
      }

      affectedMerchants.add(merchantId);

      const normalizedName = safeNormalize(catName);
      if (!categoriesToCreate.has(merchantId)) {
        categoriesToCreate.set(merchantId, new Map());
      }
      const mCats = categoriesToCreate.get(merchantId);
      if (!mCats.has(normalizedName)) {
        mCats.set(normalizedName, catName);
      }
    }

    // Step 2: Ensure categories exist
    let totalCategoriesCreated = 0;
    for (const [merchantId, mCats] of categoriesToCreate.entries()) {
      for (const [normalizedName, originalName] of mCats.entries()) {
        const existingCat = await ServiceCategory.findOne({ merchantId, normalizedName });
        
        if (existingCat) {
          categoryMapIds.set(`${merchantId}_${normalizedName}`, existingCat._id);
        } else {
          if (isExecute) {
            let baseSlug = slugify(originalName, { lower: true, strict: true });
            let slug = baseSlug;
            let counter = 1;
            while (await ServiceCategory.findOne({ merchantId, slug })) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }

            const maxOrderCat = await ServiceCategory.findOne({ merchantId }).sort({ sortOrder: -1 });
            const sortOrder = maxOrderCat ? maxOrderCat.sortOrder + 1 : 0;

            const newCat = await ServiceCategory.create({
              merchantId,
              name: originalName,
              normalizedName,
              slug,
              sortOrder
            });
            categoryMapIds.set(`${merchantId}_${normalizedName}`, newCat._id);
            totalCategoriesCreated++;
          } else {
            totalCategoriesCreated++;
          }
        }
      }
    }

    // Step 3: Link services
    for (const service of services) {
      if (!service.provider || service.categoryId) continue;

      let catName = (service.category || '').trim();
      const uncategorizedKeywords = ['other', 'others', 'uncategorised', 'uncategorized', 'none', 'n/a', ''];
      
      if (uncategorizedKeywords.includes(catName.toLowerCase())) {
        if (isExecute) {
          service.categoryId = null;
          service.categoryNameSnapshot = '';
          await service.save();
        }
        continue;
      }

      const merchantId = service.provider.toString();
      const normalizedName = safeNormalize(catName);
      const catId = categoryMapIds.get(`${merchantId}_${normalizedName}`);

      if (catId) {
        servicesLinked++;
        if (isExecute) {
          service.categoryId = catId;
          service.categoryNameSnapshot = categoriesToCreate.get(merchantId).get(normalizedName);
          await service.save();
        }
      }
    }

    const postMigrationCount = await Service.countDocuments();

    console.log('\n--- Migration Report ---');
    console.log(`Total Services Scanned: ${totalServicesScanned}`);
    console.log(`Already Migrated: ${alreadyMigrated}`);
    console.log(`Affected Merchants: ${affectedMerchants.size}`);
    console.log(`Categories to Create: ${totalCategoriesCreated}`);
    console.log(`Services to be Linked: ${servicesLinked}`);
    console.log(`Services to be left Uncategorized: ${servicesLeftUncategorized}`);
    console.log(`Invalid Records Skipped: ${invalidRecords}`);
    console.log(`Service Count Validation (Before vs After): ${totalServicesScanned} == ${postMigrationCount}`);
    
    if (totalServicesScanned !== postMigrationCount) {
      console.error('[CRITICAL] Service count mismatch. Possible deletion occurred.');
      process.exit(1);
    }

    console.log(isExecute ? '\nMigration COMPLETED successfully.' : '\nDry-run COMPLETED successfully.');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
