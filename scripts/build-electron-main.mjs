import fs from 'fs'
fs.mkdirSync('dist-electron', { recursive: true })
// Simple copy with import.meta fix - for now just copy ts to js with minimal transform
let main = fs.readFileSync('electron/main.ts','utf8')
main = main.replace(/from 'electron'/g, "from 'electron'")
fs.writeFileSync('dist-electron/main.js', main)
let preload = fs.readFileSync('electron/preload.ts','utf8')
fs.writeFileSync('dist-electron/preload.js', preload)
console.log('Electron main built to dist-electron (copy)')
