import inquirer from 'inquirer';
import dns from 'dns';
import { promisify } from 'util';
import https from 'https';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolve4 = promisify(dns.resolve4);

async function getPublicIP() {
    return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data.trim()));
        }).on('error', reject);
    });
}

async function initDB() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE,
                    password TEXT
                )
            `, (err) => {
                if (err) reject(err);
                resolve(db);
            });
        });
    });
}

async function insertUser(db, email, password) {
    const hash = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

async function runInstaller() {
    console.log("==========================================");
    console.log("        Welcome to Nova Hosting           ");
    console.log("==========================================\\n");
    console.log("Create your admin account:");

    try {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'email',
                prefix: '*',
                message: "Provide the email address that will be used to configure Let's Encrypt and Nova Hosting:",
                validate: input => input.includes('@') ? true : 'Please enter a valid email.'
            },
            {
                type: 'password',
                name: 'password',
                prefix: '*',
                message: 'Create admin password:',
                mask: '*',
                validate: input => input.length >= 6 ? true : 'Password must be at least 6 characters.'
            },
            {
                type: 'input',
                name: 'domain',
                prefix: '*',
                message: 'Enter your subdomain from Cloudflare DNS (e.g., panel.yourdomain.com):',
                validate: input => input.includes('.') ? true : 'Please enter a valid domain.'
            }
        ]);

        console.log("\n[INFO] Fetching VPS Public IP...");
        const vpsIp = await getPublicIP();
        console.log(`[INFO] VPS Public IP: ${vpsIp}`);

        console.log(`[INFO] Verifying DNS records for ${answers.domain}...`);
        let domainIps;
        try {
            domainIps = await resolve4(answers.domain);
        } catch (e) {
            console.error(`\n❌ SSL Certificate Failed - Could not resolve domain ${answers.domain}`);
            process.exit(1);
        }

        // On localhost, it will likely fail if domain doesn't match public IP.
        // We'll leave it strictly as requested by the user.
        if (!domainIps.includes(vpsIp)) {
             console.error(`\n❌ SSL Certificate Failed - DNS for ${answers.domain} points to ${domainIps.join(', ')} but your VPS IP is ${vpsIp}.`);
             console.error("Please update your Cloudflare/DNS records and try again.");
             process.exit(1);
        }

        console.log("\n✅ DNS Verified Successfully!");

        console.log("[INFO] Initializing Database...");
        const db = await initDB();
        await insertUser(db, answers.email, answers.password);
        
        // Also add admin to data.json for Next.js frontend
        try {
            const dataPath = path.join(__dirname, 'data.json');
            let data = { users: [] };
            if (fs.existsSync(dataPath)) {
                data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                if (!data.users) data.users = [];
            }
            const adminUser = {
                username: 'admin',
                email: answers.email.toLowerCase(),
                password: answers.password, // Plaintext for now to match data.json auth logic
                role: 'admin',
                timestamp: Date.now()
            };
            // Remove existing admin if any
            data.users = data.users.filter(u => u.email !== adminUser.email);
            data.users.push(adminUser);
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        } catch (err) {
            console.error("Failed to update data.json for admin user:", err);
        }
        
        console.log("✅ Admin user created.");

        console.log("[INFO] Generating .env file...");
        const envContent = `PANEL_DOMAIN=${answers.domain}\nPORT=3000\nNODE_ENV=production\n`;
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);
        console.log("✅ .env file created.");

        console.log("\n==========================================");
        console.log("✅ Installation Complete!");
        console.log(`You can now access your panel at: https://${answers.domain}`);
        console.log("Run 'npm start' to start the backend daemon.");
        console.log("==========================================\n");

    } catch (err) {
        console.error("\n❌ Installation failed:", err);
    }
}

runInstaller();
