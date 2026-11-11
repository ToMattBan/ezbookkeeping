// Adds the ezbk:// intent filter to the generated Android project. Safe to run repeatedly.
// Usage: node scripts/android-add-deeplink.mjs   (run after "npx cap add android" / "npx cap sync")
import fs from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const marker = 'android:scheme="ezbk"';

const intentFilter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="ezbk" />
            </intent-filter>
`;

if (!fs.existsSync(manifestPath)) {
    console.error(`${manifestPath} not found. Run "npx cap add android" first.`);
    process.exit(1);
}

const manifest = fs.readFileSync(manifestPath, 'utf8');

if (manifest.includes(marker)) {
    console.log('ezbk:// intent filter already present.');
    process.exit(0);
}

// insert right before the end of the main activity
const updated = manifest.replace(/(\s*)<\/activity>/, `${intentFilter}$1</activity>`);

if (updated === manifest) {
    console.error('Could not find </activity> in AndroidManifest.xml, add the intent filter manually.');
    process.exit(1);
}

fs.writeFileSync(manifestPath, updated);
console.log('Added ezbk:// intent filter to AndroidManifest.xml');
