/**
 * Re-sync Sample Essays: WordPress GraphQL → Supabase
 * Chỉ chạy phần Sample Essays (upsert by slug, an toàn để chạy lại nhiều lần)
 *
 * Run: node scripts/resync-sample-essays.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WP_URL = process.env.WP_URL || 'https://cms.ieltspredictiontest.com';

async function graphqlQuery(query, variables = {}) {
    const res = await fetch(`${WP_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors.map(e => e.message).join(', '));
    return json.data;
}

async function resyncSampleEssays() {
    console.log('\n📦 Re-sync Sample Essays: WordPress → Supabase');
    console.log('='.repeat(50));

    let hasNext = true, after = null;
    let total = 0, errors = 0, batch = 0;

    const query = `query GetEssays($after: String) {
        sampleEssays(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
                databaseId slug title content date status
                sampleEssayFields { quarter }
                writingSampleEssayFields { task topic }
                speakingSampleEssayFields { part questionType }
                sampleEssayTypes { nodes { name slug } }
                sampleSources { nodes { name slug } }
            }
        }
    }`;

    while (hasNext) {
        try {
            const data = await graphqlQuery(query, { after });
            const essays = data?.sampleEssays?.nodes || [];
            if (essays.length === 0) break;

            batch++;
            console.log(`\n  📄 Batch ${batch}: ${essays.length} essays...`);

            for (const e of essays) {
                // Xác định skill từ sampleEssayTypes
                const types = e.sampleEssayTypes?.nodes || [];
                const typeNames = types.map(t => t.slug);
                let skill = null;
                if (typeNames.some(n => n.includes('writing'))) skill = 'writing';
                else if (typeNames.some(n => n.includes('speaking'))) skill = 'speaking';
                else if (typeNames.some(n => n.includes('reading'))) skill = 'reading';
                else if (typeNames.some(n => n.includes('listening'))) skill = 'listening';

                const sources = e.sampleSources?.nodes || [];
                const source = sources.map(s => s.name).join(', ') || null;

                const wf = e.writingSampleEssayFields || {};
                const sf = e.speakingSampleEssayFields || {};
                const ef = e.sampleEssayFields || {};

                const { error: insertErr } = await supabase.from('sample_essays').upsert({
                    title: e.title || 'Untitled',
                    slug: e.slug,
                    content: e.content || null,
                    skill,
                    part: sf.part ? (Array.isArray(sf.part) ? sf.part[0] : sf.part) : null,
                    question_type: sf.questionType ? (Array.isArray(sf.questionType) ? sf.questionType[0] : sf.questionType) : null,
                    quarter: ef.quarter ? (Array.isArray(ef.quarter) ? ef.quarter[0] : ef.quarter) : null,
                    topic: wf.topic ? (Array.isArray(wf.topic) ? wf.topic[0] : wf.topic) : null,
                    task: wf.task ? (Array.isArray(wf.task) ? wf.task[0] : wf.task) : null,
                    source,
                    status: e.status === 'publish' ? 'published' : 'draft',
                    published_at: e.date || null,
                }, { onConflict: 'slug' });

                if (insertErr) {
                    errors++;
                    console.error(`  ⚠️ [${e.slug}] ${insertErr.message}`);
                } else {
                    total++;
                }
            }

            hasNext = data?.sampleEssays?.pageInfo?.hasNextPage || false;
            after = data?.sampleEssays?.pageInfo?.endCursor || null;
            console.log(`  ✅ Batch ${batch} done. Tổng: ${total} essays, Lỗi: ${errors}`);
        } catch (err) {
            console.error(`  ❌ Batch error: ${err.message}`);
            if (!after) break;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Hoàn thành! Tổng: ${total} essays được upsert, ${errors} lỗi.`);
}

resyncSampleEssays().catch(err => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
});
