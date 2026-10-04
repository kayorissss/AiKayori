#!/usr/bin/env node
// Проверка обновлений AI-Kayori
import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const current = pkg.version

console.log(`🔍 Проверка обновлений AI-Kayori...`)
console.log(`Текущая версия: v${current}`)

// Simulate fetching from GitHub releases
// In real app: fetch('https://api.github.com/repos/kayorissss/AiKayori/releases/latest')
const latest = current // no newer for demo

if (latest === current) {
  console.log(`✅ У вас последняя версия v${current}`)
} else {
  console.log(`🆕 Доступна новая версия v${latest}!`)
  console.log(`Скачай: AI-Kayori-Setup-v${latest}.exe / Portable-v${latest}.exe / v${latest}.apk`)
}

console.log(`
Сборки:
- PC Setup:    AI-Kayori-Setup-v${current}.exe
- PC Portable: AI-Kayori-Portable-v${current}.exe
- Android APK: AI-Kayori-v${current}.apk
`)
