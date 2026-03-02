// One-time migration: moves old "coordinates" flat array to new GeoJSON "geoLocation" field
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const items = db.collection('items');

    const all = await items.find({ coordinates: { $exists: true } }).toArray();
    console.log(`Found ${all.length} items with old coordinates field`);

    let migrated = 0;
    for (const item of all) {
        if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
            const [lng, lat] = item.coordinates;
            await items.updateOne(
                { _id: item._id },
                {
                    $set: {
                        geoLocation: {
                            type: 'Point',
                            coordinates: [lng, lat],
                        },
                    },
                    $unset: { coordinates: '' },
                }
            );
            migrated++;
            console.log(`  Migrated: ${item.title} [${lng}, ${lat}]`);
        } else {
            // No valid coordinates — just remove the old field
            await items.updateOne({ _id: item._id }, { $unset: { coordinates: '' } });
            console.log(`  Cleared empty coordinates for: ${item.title}`);
        }
    }

    console.log(`\nMigration complete: ${migrated} item(s) migrated.`);
    process.exit(0);
}).catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
