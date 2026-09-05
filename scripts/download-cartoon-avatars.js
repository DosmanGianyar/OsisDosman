const fs = require('fs');
const path = require('path');

async function downloadAvatar(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
  console.log(`Saved: ${dest} (${buffer.byteLength} bytes)`);
}

async function main() {
  const uploadsDir = path.join(__dirname, '../public/uploads/candidates');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Option: Avataaars cartoon avatar style (very expressive, professional, friendly)
  const calon1Url = 'https://api.dicebear.com/9.x/avataaars/png?seed=AgusSukarmaDosman&size=600&backgroundColor=e0e7ff&clothing=blazerAndShirt';
  const calon2Url = 'https://api.dicebear.com/9.x/avataaars/png?seed=YogaPratamaDosman&size=600&backgroundColor=fef3c7&clothing=blazerAndSweater';

  console.log('Downloading cartoon avatar for Calon 01...');
  await downloadAvatar(calon1Url, path.join(uploadsDir, 'paslon1.jpg'));

  console.log('Downloading cartoon avatar for Calon 02...');
  await downloadAvatar(calon2Url, path.join(uploadsDir, 'paslon2.jpg'));

  console.log('✅ Cartoon avatars successfully downloaded!');
}

main().catch(console.error);
