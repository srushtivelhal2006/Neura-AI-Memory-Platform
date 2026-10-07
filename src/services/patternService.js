const { query } = require('../config/database');

async function analyzePatterns(newMemory, tenantId) {
  const derivedMemories = [];
  let supersedes = null;

  try {
    const recentResult = await query(
      `SELECT id, content, memory_type, session_id, metadata, confidence, created_at
       FROM memories
       WHERE tenant_id = $1 AND user_id = $2 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 20`,
      [tenantId, newMemory.user_id]
    );

    const recentMemories = recentResult.rows;

    if (recentMemories.length === 0) {
      return { derivedMemories, supersedes };
    }

    const contentLower = newMemory.content.toLowerCase();
    const contentWords = extractKeyPhrases(contentLower);

    const contradiction = detectContradiction(contentWords, contentLower, recentMemories);
    if (contradiction) {
      supersedes = {
        memory_id: contradiction.id,
        confidence_drop: true,
      };
    }

    const corrections = detectRepeatedCorrections(contentLower, recentMemories);
    if (corrections.count >= 2) {
      derivedMemories.push({
        user_id: newMemory.user_id,
        app_id: newMemory.app_id,
        org_id: newMemory.org_id,
        session_id: newMemory.session_id,
        content: `User repeatedly corrects: "${corrections.topic}". Inferred preference: ${newMemory.content}`,
        memory_type: 'behavioral_pattern',
        tags: ['auto_detected', 'correction_pattern'],
        metadata: {
          pattern_type: 'repeated_correction',
          correction_count: corrections.count,
          source_memory_ids: corrections.sourceIds,
          auto_generated: true,
        },
        confidence: Math.min(0.6 + corrections.count * 0.1, 0.95),
      });
    }

    const frequency = detectFrequencyPattern(contentWords, recentMemories);
    if (frequency.count >= 3) {
      const alreadyHasPattern = recentMemories.some(
        (m) =>
          m.memory_type === 'behavioral_pattern' &&
          m.metadata?.pattern_type === 'frequent_topic' &&
          m.content.toLowerCase().includes(frequency.topic)
      );

      if (!alreadyHasPattern) {
        derivedMemories.push({
          user_id: newMemory.user_id,
          app_id: newMemory.app_id,
          org_id: newMemory.org_id,
          session_id: newMemory.session_id,
          content: `User frequently discusses: "${frequency.topic}" (mentioned ${frequency.count} times across sessions)`,
          memory_type: 'behavioral_pattern',
          tags: ['auto_detected', 'frequency_pattern'],
          metadata: {
            pattern_type: 'frequent_topic',
            mention_count: frequency.count,
            source_memory_ids: frequency.sourceIds,
            auto_generated: true,
          },
          confidence: Math.min(0.5 + frequency.count * 0.1, 0.9),
        });
      }
    }
  } catch (err) {
    console.error('Pattern analysis error (non-fatal):', err.message);
  }

  return { derivedMemories, supersedes };
}

function extractKeyPhrases(text) {
  const stopWords = new Set([
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
    'should', 'may', 'might', 'must', 'can', 'could', 'of', 'in', 'to',
    'for', 'with', 'on', 'at', 'by', 'from', 'as', 'into', 'about',
    'like', 'through', 'after', 'before', 'between', 'under', 'above',
    'and', 'but', 'or', 'not', 'no', 'so', 'if', 'than', 'too', 'very',
    'just', 'that', 'this', 'these', 'those', 'then', 'there', 'here',
    'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'why',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'also', 'still', 'even',
  ]);

  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function detectContradiction(newWords, newContent, recentMemories) {
  const negationPairs = [
    { patterns: ['prefer', 'not', 'don\'t like'], counter: ['prefer', 'like', 'love'] },
    { patterns: ['don\'t', 'do not', 'never'], counter: ['always', 'do', 'prefer'] },
    { patterns: ['hate', 'dislike'], counter: ['like', 'love', 'prefer'] },
  ];

  for (const memory of recentMemories) {
    if (memory.memory_type !== 'explicit_fact' && memory.memory_type !== 'preference') {
      continue;
    }

    const memContent = memory.content.toLowerCase();
    const overlap = newWords.filter((w) => memContent.includes(w));

    if (overlap.length < 2) continue;

    for (const pair of negationPairs) {
      const newHasNeg = pair.patterns.some((p) => newContent.includes(p));
      const oldHasPos = pair.counter.some((p) => memContent.includes(p));
      const newHasPos = pair.counter.some((p) => newContent.includes(p));
      const oldHasNeg = pair.patterns.some((p) => memContent.includes(p));

      if ((newHasNeg && oldHasPos) || (newHasPos && oldHasNeg)) {
        return memory;
      }
    }
  }

  return null;
}

function detectRepeatedCorrections(newContent, recentMemories) {
  const correctionSignals = [
    'actually', 'no i meant', 'correction', 'i meant', 'not that',
    'wrong', 'let me correct', 'i prefer', 'change that to',
    'instead of', 'rather than', 'switch to',
  ];

  const hasCorrection = correctionSignals.some((s) => newContent.includes(s));
  if (!hasCorrection) {
    return { count: 0, topic: '', sourceIds: [] };
  }

  const newWords = extractKeyPhrases(newContent);
  let matchCount = 0;
  let topic = '';
  const sourceIds = [];

  for (const memory of recentMemories) {
    const memContent = memory.content.toLowerCase();
    const memHasCorrection = correctionSignals.some((s) => memContent.includes(s));

    if (memHasCorrection) {
      const memWords = extractKeyPhrases(memContent);
      const overlap = newWords.filter((w) => memWords.includes(w));

      if (overlap.length >= 2) {
        matchCount++;
        sourceIds.push(memory.id);
        if (!topic) {
          topic = overlap.slice(0, 3).join(' ');
        }
      }
    }
  }

  return { count: matchCount, topic, sourceIds };
}

function detectFrequencyPattern(newWords, recentMemories) {
  const topicCounts = {};
  const topicSources = {};

  for (const memory of recentMemories) {
    const memWords = extractKeyPhrases(memory.content.toLowerCase());

    for (const word of newWords) {
      if (memWords.includes(word)) {
        topicCounts[word] = (topicCounts[word] || 1) + 1;
        if (!topicSources[word]) topicSources[word] = [];
        if (!topicSources[word].includes(memory.id)) {
          topicSources[word].push(memory.id);
        }
      }
    }
  }

  let maxTopic = '';
  let maxCount = 0;
  let maxSources = [];

  for (const [topic, count] of Object.entries(topicCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxTopic = topic;
      maxSources = topicSources[topic] || [];
    }
  }

  return { count: maxCount, topic: maxTopic, sourceIds: maxSources };
}

module.exports = { analyzePatterns };
