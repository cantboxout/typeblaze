const fs = require('fs');
const { execSync } = require('child_process');

const packageJsonPath = './package.json';

try {
    console.log('Reading package.json...');
    const data = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(data);

    let isModified = false;

    // Remove from dependencies
    if (packageJson.dependencies && packageJson.dependencies['reportlab']) {
        delete packageJson.dependencies['reportlab'];
        isModified = true;
        console.log('✅ Removed reportlab from dependencies.');
    }

    // Remove from devDependencies
    if (packageJson.devDependencies && packageJson.devDependencies['reportlab']) {
        delete packageJson.devDependencies['reportlab'];
        isModified = true;
        console.log('✅ Removed reportlab from devDependencies.');
    }

    // Save the file if we made changes
    if (isModified) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Successfully saved clean package.json.');
    } else {
        console.log('⚠️ reportlab was not found in package.json. Moving on...');
    }

    // Run npm install
    console.log('\nRunning npm install...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('\n🎉 All done! Your packages are installed.');

} catch (error) {
    console.error('❌ An error occurred:', error.message);
}