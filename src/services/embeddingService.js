const { pipeline } = require('@xenova/transformers');
const env = require('../config/env');

let embeddingPipeline = null;
let isLoading = false;
let loadingPromise = null;

async function getPipeline() {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (isLoading && loadingPromise) {
    return loadingPromise;
  }

  isLoading = true;
  console.log(`🧠 Loading embedding model: ${env.embedding.model}...`);

  loadingPromise = pipeline('feature-extraction', env.embedding.model, {
    quantized: true,
  });

  try {
    embeddingPipeline = await loadingPromise;
    console.log(`✅ Embedding model loaded: ${env.embedding.model} (${env.embedding.dimensions}d)`);
    return embeddingPipeline;
  } catch (err) {
    isLoading = false;
    loadingPromise = null;
    console.error('❌ Failed to load embedding model:', err.message);
    throw err;
  }
}

async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Embedding input must be a non-empty string');
  }

  const extractor = await getPipeline();
  const truncated = text.substring(0, 8192);

  const output = await extractor(truncated, {
    pooling: 'mean',
    normalize: true,
  });

  const embedding = Array.from(output.data);

  if (embedding.length !== env.embedding.dimensions) {
    throw new Error(
      `Embedding dimension mismatch: got ${embedding.length}, expected ${env.embedding.dimensions}`
    );
  }

  return embedding;
}

async function generateBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const results = [];
  const batchSize = 32;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    results.push(...embeddings);
  }

  return results;
}

async function preloadModel() {
  try {
    await getPipeline();
    return true;
  } catch (err) {
    console.error('Failed to preload embedding model:', err.message);
    return false;
  }
}

module.exports = { generateEmbedding, generateBatch, preloadModel };
