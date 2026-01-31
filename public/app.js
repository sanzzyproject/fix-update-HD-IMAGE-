const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const previewContainer = document.getElementById('previewContainer');
const previewImg = document.getElementById('previewImg');
const processBtn = document.getElementById('processBtn');
const loading = document.getElementById('loading');
const resultContainer = document.getElementById('resultContainer');
const resultImg = document.getElementById('resultImg');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

let currentBase64 = null;

// Handle File Selection
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    currentBase64 = e.target.result;
    previewImg.src = currentBase64;
    dropZone.classList.add('hidden');
    previewContainer.classList.remove('hidden');
  };
}

// Handle Process
processBtn.addEventListener('click', async () => {
  if (!currentBase64) return;

  processBtn.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: currentBase64 })
    });

    const data = await response.json();

    if (data.success) {
      resultImg.src = data.result;
      downloadBtn.href = data.result;
      previewContainer.classList.add('hidden');
      resultContainer.classList.remove('hidden');
    } else {
      alert('Gagal: ' + (data.error || 'Terjadi kesalahan'));
      processBtn.classList.remove('hidden');
    }
  } catch (err) {
    alert('Koneksi Error');
    console.error(err);
    processBtn.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
});

// Reset
resetBtn.addEventListener('click', () => {
  fileInput.value = '';
  currentBase64 = null;
  resultContainer.classList.add('hidden');
  dropZone.classList.remove('hidden');
  processBtn.classList.remove('hidden');
});
