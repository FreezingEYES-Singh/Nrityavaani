import fs from 'fs';
import path from 'path';

function traverseAndReplace(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') {
                traverseAndReplace(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;
            
            // Replacements
            const replacements = [
                // Replace bg-white/[0.05] etc
                { regex: /bg-white\/(\[[0-9.]+\]|[0-9]+)/g, replace: 'bg-foreground/$1' },
                { regex: /border-white\/(\[[0-9.]+\]|[0-9]+)/g, replace: 'border-foreground/$1' },
                { regex: /text-white\/(\[[0-9.]+\]|[0-9]+)/g, replace: 'text-foreground/$1' },
                { regex: /hover:bg-white\/(\[[0-9.]+\]|[0-9]+)/g, replace: 'hover:bg-foreground/$1' },
                { regex: /focus:bg-white\/(\[[0-9.]+\]|[0-9]+)/g, replace: 'focus:bg-foreground/$1' },
                // Replace bg-black for layouts
                { regex: /bg-black(?=[\s"'])/g, replace: 'bg-background' },
                // Some specific bg-white literals
                { regex: /bg-white(?=[\s"'])/g, replace: 'bg-foreground' },
            ];

            replacements.forEach(({ regex, replace }) => {
                newContent = newContent.replace(regex, replace);
            });
            
            // Undo some replacements where literal black or white was explicitly intended for contrast
            // text-black on bg-primary is fine, but bg-background text-foreground is standard.
            // if we accidentally changed bg-white text-black on something that needed contrast, let's just let it adapt.
            // The camera feed might have needed literal black:
            if (file === 'CameraFeed.tsx' || file === 'page.tsx') {
               newContent = newContent.replace(/bg-background rounded-lg/g, 'bg-black rounded-lg');
            }
            if (file === 'MudraCard.tsx' || file === 'checkout/page.tsx' || file === 'CameraFeed.tsx') {
               // MudraCard uses "bg-white text-black" as a literal light button. In dark mode it's white. In light mode, it could remain white or be foreground/background.
               newContent = newContent.replace(/bg-foreground text-black/g, 'bg-foreground text-background');
            }

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

const targetDir = path.resolve('./src');
console.log(`Starting secondary replacement in: ${targetDir}`);
traverseAndReplace(targetDir);
console.log('Done.');
