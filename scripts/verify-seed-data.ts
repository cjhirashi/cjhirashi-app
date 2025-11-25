// ============================================
// VERIFY SEED DATA - CJHIRASHI APP v0.1
// ============================================
// Verifica que los datos de seed se insertaron correctamente
// Ejecución: npm run db:verify-seed
// ============================================

import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying seed data...\n');

  try {
    // ============================================
    // Verificar Agents
    // ============================================
    console.log('📋 Checking Agents...');

    const agents = await prisma.agents.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`  ✓ Total agents: ${agents.length}`);

    if (agents.length === 0) {
      console.error('  ❌ No agents found! Seed data was not inserted.');
    } else {
      agents.forEach((agent, index) => {
        console.log(`  ${index + 1}. ${agent.name} - ${agent.specialization} (Active: ${agent.is_active})`);
      });
    }

    console.log('');

    // ============================================
    // Verificar Agent Models
    // ============================================
    console.log('📋 Checking Agent Models...');

    const agentModels = await prisma.agent_models.findMany({
      include: {
        agent: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { agent_id: 'asc' },
        { tier: 'asc' }
      ]
    });

    console.log(`  ✓ Total agent models: ${agentModels.length}`);

    if (agentModels.length === 0) {
      console.error('  ❌ No agent models found! Seed data was not inserted.');
    } else {
      // Group by agent
      const modelsByAgent = agentModels.reduce((acc, model) => {
        const agentName = model.agent.name;
        if (!acc[agentName]) {
          acc[agentName] = [];
        }
        acc[agentName].push(model);
        return acc;
      }, {} as Record<string, typeof agentModels>);

      Object.entries(modelsByAgent).forEach(([agentName, models]) => {
        console.log(`  ${agentName}:`);
        models.forEach(model => {
          console.log(`    - ${model.tier}: ${model.model_provider}/${model.model_name} (temp: ${model.temperature})`);
        });
      });
    }

    console.log('');

    // ============================================
    // Verificar RLS Policies
    // ============================================
    console.log('📋 Checking RLS Policies...');

    const rlsPolicies = await prisma.$queryRaw<Array<{
      tablename: string;
      policyname: string;
      cmd: string;
    }>>`
      SELECT
        schemaname,
        tablename,
        policyname,
        cmd
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('agents', 'agent_models', 'projects', 'conversations', 'corpora', 'agent_corpus_assignments', 'corpus_documents', 'embeddings')
      ORDER BY tablename, policyname;
    `;

    console.log(`  ✓ Total RLS policies: ${rlsPolicies.length}`);

    if (rlsPolicies.length === 0) {
      console.warn('  ⚠️  No RLS policies found for new tables!');
    } else {
      // Group by table
      const policiesByTable = rlsPolicies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) {
          acc[policy.tablename] = [];
        }
        acc[policy.tablename].push(policy);
        return acc;
      }, {} as Record<string, typeof rlsPolicies>);

      Object.entries(policiesByTable).forEach(([tableName, policies]) => {
        console.log(`  ${tableName}: ${policies.length} policies`);
        policies.forEach(policy => {
          console.log(`    - ${policy.policyname} (${policy.cmd})`);
        });
      });
    }

    console.log('');

    // ============================================
    // Verificar Triggers
    // ============================================
    console.log('📋 Checking Triggers...');

    const triggers = await prisma.$queryRaw<Array<{
      trigger_name: string;
      event_object_table: string;
      event_manipulation: string;
    }>>`
      SELECT
        trigger_name,
        event_object_table,
        event_manipulation
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table IN ('agents', 'agent_models', 'projects', 'conversations', 'corpora', 'corpus_documents')
      ORDER BY event_object_table, trigger_name;
    `;

    console.log(`  ✓ Total triggers: ${triggers.length}`);

    if (triggers.length > 0) {
      triggers.forEach(trigger => {
        console.log(`  ${trigger.event_object_table}.${trigger.trigger_name} (${trigger.event_manipulation})`);
      });
    }

    console.log('');

    // ============================================
    // Resumen Final
    // ============================================
    console.log('==========================================');
    console.log('RESUMEN DE VERIFICACIÓN');
    console.log('==========================================');

    const expectedAgents = 3;
    const expectedModels = 9; // 3 tiers × 3 agents

    if (agents.length === expectedAgents) {
      console.log(`✅ Agents: ${agents.length}/${expectedAgents} (OK)`);
    } else {
      console.log(`❌ Agents: ${agents.length}/${expectedAgents} (FALLO)`);
    }

    if (agentModels.length === expectedModels) {
      console.log(`✅ Agent Models: ${agentModels.length}/${expectedModels} (OK)`);
    } else {
      console.log(`❌ Agent Models: ${agentModels.length}/${expectedModels} (FALLO)`);
    }

    if (rlsPolicies.length > 0) {
      console.log(`✅ RLS Policies: ${rlsPolicies.length} (OK)`);
    } else {
      console.log(`⚠️  RLS Policies: ${rlsPolicies.length} (ADVERTENCIA)`);
    }

    if (triggers.length > 0) {
      console.log(`✅ Triggers: ${triggers.length} (OK)`);
    } else {
      console.log(`⚠️  Triggers: ${triggers.length} (ADVERTENCIA)`);
    }

    console.log('');

    if (agents.length === expectedAgents && agentModels.length === expectedModels) {
      console.log('✨ VERIFICACIÓN EXITOSA - Seed data insertado correctamente\n');
    } else {
      console.log('❌ VERIFICACIÓN FALLIDA - Algunos datos no se insertaron\n');
      console.log('Ejecuta: npm run db:apply-seed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error during verification:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
