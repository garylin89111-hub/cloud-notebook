const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-\[#0B0B0C\]/g, replacement: 'bg-[#F8F9FA] dark:bg-[#0B0B0C]' },
  { regex: /bg-\[#1F1F22\]/g, replacement: 'bg-white dark:bg-[#1F1F22]' },
  { regex: /bg-\[#18181A\]/g, replacement: 'bg-white dark:bg-[#18181A]' },
  { regex: /bg-\[#2C2C30\]/g, replacement: 'bg-slate-200 dark:bg-[#2C2C30]' },
  { regex: /bg-\[#262629\]/g, replacement: 'bg-slate-100 dark:bg-[#262629]' },
  { regex: /bg-\[#2E2E33\]/g, replacement: 'bg-slate-200 dark:bg-[#2E2E33]' },
  { regex: /bg-\[#2A2A2E\]/g, replacement: 'bg-slate-100 dark:bg-[#2A2A2E]' },
  { regex: /bg-\[#1A1A1D\]/g, replacement: 'bg-white dark:bg-[#1A1A1D]' },
  { regex: /bg-\[#121214\]/g, replacement: 'bg-slate-50 dark:bg-[#121214]' },
  { regex: /bg-\[#38383F\]/g, replacement: 'bg-slate-200 dark:bg-[#38383F]' },
  
  { regex: /border-\[#2C2C30\]/g, replacement: 'border-slate-200 dark:border-[#2C2C30]' },
  { regex: /border-\[#26262A\]/g, replacement: 'border-slate-200 dark:border-[#26262A]' },
  { regex: /border-\[#333338\]/g, replacement: 'border-slate-300 dark:border-[#333338]' },
  { regex: /border-\[#3A3A40\]/g, replacement: 'border-slate-300 dark:border-[#3A3A40]' },
  { regex: /border-\[#38383F\]/g, replacement: 'border-slate-300 dark:border-[#38383F]' },
  
  { regex: /text-\[#A0A0A0\]/g, replacement: 'text-slate-500 dark:text-[#A0A0A0]' },
  { regex: /text-\[#FFFFFF\]/g, replacement: 'text-slate-900 dark:text-[#FFFFFF]' },
  
  // Replace text-white cautiously: avoid buttons with bg-[#0381FE]
  // We will do a generic text-white replacement and manually fix any primary buttons if needed
  // Alternatively, just do negative lookbehind if supported, but let's just do it simply:
  // We'll skip text-white here and do it carefully, or just let users have white text in light mode on dark components (which is bad).
  // Let's replace 'text-white' with 'text-slate-900 dark:text-white', but only if it's not preceded by bg-blue-xxx or bg-[#0381FE]
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      // Handle text-white
      // Regex explanation: match text-white but not if it's in a string containing bg-[#0381FE] or bg-blue-600
      // Since it's hard to parse Tailwind classes reliably with regex, we will just replace all `text-white` 
      // except when `bg-[#0381FE]` is on the same line.
      const lines = content.split('\n');
      const newLines = lines.map(line => {
        if (!line.includes('bg-[#0381FE]') && !line.includes('bg-rose-600') && !line.includes('bg-blue-600') && !line.includes('bg-rose-500')) {
            return line.replace(/\btext-white\b/g, 'text-slate-900 dark:text-white');
        }
        return line;
      });
      content = newLines.join('\n');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Theme conversion complete.');
