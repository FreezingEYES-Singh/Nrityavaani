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
            
            const replacements = [
                // Fix gradients and shadows that use literal black
                { regex: /via-black/g, replace: 'via-background' },
                { regex: /to-black/g, replace: 'to-background' },
                { regex: /from-black/g, replace: 'from-background' },
                { regex: /ring-offset-black/g, replace: 'ring-offset-background' },
                
                // Increase text opacity for better legibility (premium feel)
                { regex: /text-foreground\/40/g, replace: 'text-foreground/60' },
                { regex: /text-foreground\/50/g, replace: 'text-foreground/70' },
                { regex: /text-foreground\/60/g, replace: 'text-foreground/80' },
                { regex: /text-foreground\/70/g, replace: 'text-foreground/90' },
                { regex: /text-foreground\/80/g, replace: 'text-foreground/90' },
            ];

            replacements.forEach(({ regex, replace }) => {
                newContent = newContent.replace(regex, replace);
            });

            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated legibility: ${fullPath}`);
            }
        }
    });
}

const targetDir = path.resolve('./src/app/about');
console.log(`Starting in: ${targetDir}`);
traverseAndReplace(targetDir);

const targetDir2 = path.resolve('./src/app/library');
console.log(`Starting in: ${targetDir2}`);
traverseAndReplace(targetDir2);

const targetDir3 = path.resolve('./src/components/library');
console.log(`Starting in: ${targetDir3}`);
traverseAndReplace(targetDir3);

console.log('Done.');
