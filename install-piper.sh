set -e

PIPER_DIR="/root/piper"
MODEL_DIR="/root/piper/models"
PIPER_VERSION="2023.11.14-2"
BINARY_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz"
MODEL_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/argana/medium"

echo "📦 Membuat direktori..."
mkdir -p "$PIPER_DIR" "$MODEL_DIR"

echo ""
echo "⬇️  Download Piper binary..."

if command -v wget &>/dev/null; then
  wget -q --show-progress --content-disposition \
    "$BINARY_URL" -O /tmp/piper.tar.gz
else
  curl -L --retry 3 --retry-delay 2 \
    -H "Accept: application/octet-stream" \
    "$BINARY_URL" -o /tmp/piper.tar.gz
fi

FILETYPE=$(file /tmp/piper.tar.gz)
echo "File type: $FILETYPE"

if echo "$FILETYPE" | grep -q "gzip"; then
  echo "✅ Binary downloaded"
else
  echo "❌ Download gagal atau bukan file binary"
  echo "Coba download manual:"
  echo "  wget '$BINARY_URL' -O /tmp/piper.tar.gz"
  exit 1
fi

echo "📂 Extract..."
tar -xzf /tmp/piper.tar.gz -C "$PIPER_DIR" --strip-components=1
rm /tmp/piper.tar.gz
chmod +x "$PIPER_DIR/piper"
echo "✅ Piper binary: $PIPER_DIR/piper"

echo ""
echo "⬇️  Download model Bahasa Indonesia (argana-medium ~63MB)..."

if command -v wget &>/dev/null; then
  wget -q --show-progress \
    "${MODEL_BASE}/id_ID-argana-medium.onnx" \
    -O "${MODEL_DIR}/id_ID-argana-medium.onnx"
  wget -q --show-progress \
    "${MODEL_BASE}/id_ID-argana-medium.onnx.json" \
    -O "${MODEL_DIR}/id_ID-argana-medium.onnx.json"
else
  curl -L --retry 3 \
    "${MODEL_BASE}/id_ID-argana-medium.onnx" \
    -o "${MODEL_DIR}/id_ID-argana-medium.onnx"
  curl -L --retry 3 \
    "${MODEL_BASE}/id_ID-argana-medium.onnx.json" \
    -o "${MODEL_DIR}/id_ID-argana-medium.onnx.json"
fi

MODEL_SIZE=$(stat -c%s "${MODEL_DIR}/id_ID-argana-medium.onnx" 2>/dev/null || echo 0)
if [ "$MODEL_SIZE" -lt 1000000 ]; then
  echo "❌ Model terlalu kecil ($MODEL_SIZE bytes) — kemungkinan download gagal"
  echo "Coba download manual dari:"
  echo "  $MODEL_BASE"
  exit 1
fi
echo "✅ Model: ${MODEL_DIR}/id_ID-argana-medium.onnx ($(du -sh ${MODEL_DIR}/id_ID-argana-medium.onnx | cut -f1))"

echo ""
echo "🧪 Test generate audio..."
echo "Halo, nama saya Kichi. Senang bertemu dengan kamu." | \
  "$PIPER_DIR/piper" \
  --model "${MODEL_DIR}/id_ID-argana-medium.onnx" \
  --output_file /tmp/piper_test.wav \
  --quiet 2>/dev/null

if [ -f /tmp/piper_test.wav ] && [ "$(stat -c%s /tmp/piper_test.wav)" -gt 1000 ]; then
  echo "✅ Audio generated: $(du -sh /tmp/piper_test.wav | cut -f1)"
  rm /tmp/piper_test.wav
  echo ""
  echo "════════════════════════════════════"
  echo "✅ Piper siap!"
  echo "   Binary : $PIPER_DIR/piper"
  echo "   Model  : ${MODEL_DIR}/id_ID-argana-medium.onnx"
  echo ""
  echo "Tambah ke .env:"
  echo "  PIPER_BIN=$PIPER_DIR/piper"
  echo "  PIPER_MODEL=${MODEL_DIR}/id_ID-argana-medium.onnx"
  echo "════════════════════════════════════"
else
  echo "❌ Audio gagal di-generate"
  exit 1
fi