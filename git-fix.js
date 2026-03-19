const { execSync } = require('child_process');

// The path we found using 'where git' in your terminal
const gitPath = 'C:\\Program Files\\Git\\cmd'; 

try {
    console.log('Checking current PATH...');
    
    // Get the current User PATH
    const currentPath = execSync('reg query HKCU\\Environment /v Path', { encoding: 'utf8' });
    
    if (currentPath.includes(gitPath)) {
        console.log('✨ Git is already in your PATH! Just restart your PowerShell.');
    } else {
        console.log('Adding Git to User PATH...');
        
        // Use setx to permanently update the User Environment Variable
        // We append the gitPath to the existing list
        execSync(`setx PATH "%PATH%;${gitPath}"`);
        
        console.log('✅ Success! Git has been added to your Windows PATH.');
        console.log('🚀 IMPORTANT: You MUST close and re-open PowerShell for this to take effect.');
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTry running your terminal as Administrator if this failed.');
}