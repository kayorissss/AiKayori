import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const version = pkg.version

// Update version.ts
let versionFile = fs.readFileSync('./src/lib/version.ts', 'utf-8')
versionFile = versionFile.replace(/APP_VERSION = '.*?'/, `APP_VERSION = '${version}'`)
fs.writeFileSync('./src/lib/version.ts', versionFile)

// Update index.html title
let html = fs.readFileSync('./index.html', 'utf-8')
html = html.replace(/<title>.*?<\/title>/, `<title>AI-Kayori — v${version}</title>`)
fs.writeFileSync('./index.html', html)

console.log(`✅ Версия обновлена до v${version} во всех файлах`)
console.log(`Файлы сборки будут:`)
console.log(`- AI-Kayori-Setup-v${version}.exe`)
console.log(`- AI-Kayori-Portable-v${version}.exe`)
console.log(`- AI-Kayori-v${version}.apk`)
