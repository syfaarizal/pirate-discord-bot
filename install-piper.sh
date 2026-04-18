set -e

PIPER_DIR="/root/piper"
MODEL_DIR="/root/piper/models"
PIPER_VERSION="2023.11.14-2"

echo "📦 Membuat direktori..."
mkdir -p "$PIPER_DIR" "$MODEL_DIR"

echo ""
echo "⬇️  Download Piper binary (x86_64)..."
curl -L "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz" \
  -o /tmp/piper.tar.gz

echo "📂 Extract..."
tar -xzf /tmp/piper.tar.gz -C "$PIPER_DIR" --strip-components=1
rm /tmp/piper.tar.gz

# Pastiin binary executable
chmod +x "$PIPER_DIR/piper"
echo "✅ Piper binary: $PIPER_DIR/piper"

echo ""
echo "⬇️  Download model Bahasa Indonesia (id_ID-argana-medium)..."
# Model ini ~63MB, suara female, kualitas medium — paling bagus untuk Indonesia
BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/id/id_ID/argana/medium"

curl -L "${BASE_URL}/id_ID-argana-medium.onnx" \
  -o "${MODEL_DIR}/id_ID-argana-medium.onnx"

curl -L "${BASE_URL}/id_ID-argana-medium.onnx.json" \
  -o "${MODEL_DIR}/id_ID-argana-medium.onnx.json"

echo "✅ Model: ${MODEL_DIR}/id_ID-argana-medium.onnx"

echo ""
echo "🧪 Test suara..."
echo "Halo, nama saya Kichi. Senang bertemu dengan kamu." | \
  "$PIPER_DIR/piper" \
  --model "${MODEL_DIR}/id_ID-argana-medium.onnx" \
  --output_file /tmp/piper_test.wav \
  --quiet

if [ -f /tmp/piper_test.wav ]; then
  SIZE=$(stat -c%s /tmp/piper_test.wav)
  echo "✅ WAV generated: ${SIZE} bytes"
  rm /tmp/piper_test.wav
  echo ""
  echo "════════════════════════════════════"
  echo "✅ Piper siap dipakai!"
  echo "   Binary : $PIPER_DIR/piper"
  echo "   Model  : ${MODEL_DIR}/id_ID-argana-medium.onnx"
  echo ""
  echo "👉 Sekarang update .env:"
  echo "   PIPER_BIN=$PIPER_DIR/piper"
  echo "   PIPER_MODEL=${MODEL_DIR}/id_ID-argana-medium.onnx"
  echo "════════════════════════════════════"
else
  echo "❌ WAV gak terbuat — ada masalah dengan Piper atau model"
  exit 1
fi