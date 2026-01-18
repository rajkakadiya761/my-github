const fs = require('fs-extra');
const path = require('path');

// Define paths
const backupsDir = path.join(__dirname, 'backups');
const frontendDir = path.join(__dirname, 'frontend');
const backendDir = path.join(__dirname, 'backend');
const backupScript = path.join(__dirname, 'backup.js');
const packageJson = path.join(__dirname, 'package.json');

async function getNextBackupNumber() {
    try {
        // Create backups directory if it doesn't exist
        await fs.ensureDir(backupsDir);
        
        // Get all existing backup folders
        const files = await fs.readdir(backupsDir);
        const backupFolders = files.filter(f => f.startsWith('backup-'));
        
        // Extract numbers from existing backup folders
        const numbers = backupFolders.map(folder => {
            const match = folder.match(/backup-(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });
        
        // Get the highest number and add 1, or start at 1 if no backups exist
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        return nextNumber;
    } catch (err) {
        console.error('Error getting next backup number:', err);
        return 1;
    }
}

async function createBackup() {
    try {
        const backupNumber = await getNextBackupNumber();
        const currentBackupDir = path.join(backupsDir, `backup-${backupNumber}`);

        // Create directory for current backup
        await fs.ensureDir(currentBackupDir);

        // Copy frontend directory
        if (await fs.pathExists(frontendDir)) {
            console.log('Backing up frontend...');
            await fs.copy(frontendDir, path.join(currentBackupDir, 'frontend'), {
                filter: (src) => {
                    // Exclude node_modules and .git
                    return !src.includes('node_modules') && !src.includes('.git');
                }
            });
        }

        // Copy backend directory
        if (await fs.pathExists(backendDir)) {
            console.log('Backing up backend...');
            await fs.copy(backendDir, path.join(currentBackupDir, 'backend'), {
                filter: (src) => {
                    // Exclude node_modules and .git
                    return !src.includes('node_modules') && !src.includes('.git');
                }
            });
        }

        // Copy backup.js script
        if (await fs.pathExists(backupScript)) {
            console.log('Backing up backup script...');
            await fs.copy(backupScript, path.join(currentBackupDir, 'backup.js'));
        }

        // Copy package.json
        if (await fs.pathExists(packageJson)) {
            console.log('Backing up package.json...');
            await fs.copy(packageJson, path.join(currentBackupDir, 'package.json'));
        }

        console.log(`\nBackup completed successfully!`);
        console.log(`Backup location: ${currentBackupDir}`);
        console.log(`Backup number: ${backupNumber}`);
        console.log('\nBackup contains:');
        console.log('- Frontend files (excluding node_modules)');
        console.log('- Backend files (excluding node_modules)');
        console.log('- backup.js script');
        console.log('- package.json');

    } catch (err) {
        console.error('Error creating backup:', err);
    }
}

// Run the backup
createBackup(); 