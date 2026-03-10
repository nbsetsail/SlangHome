import { executeQuery, getQuery, beginTransaction, commitTransaction, rollbackTransaction, smartUpdate, smartInsert } from '../db';
import { getUTCTimestamp } from '../date-utils';

export interface SlangVersion {
  id: string;
  slang_id: string;
  version_number: number;
  is_current: boolean;
  editor_id: string | null;
  edit_summary: string | null;
  edit_type: 'create' | 'edit' | 'rollback' | 'restore';
  phrase: string;
  explanation: string;
  example: string | null;
  origin: string | null;
  categories: string | null;
  tags: string | null;
  parent_version_id: string | null;
  created_at: string;
  editor_name?: string;
}

export interface EvolutionVersion {
  id: string;
  evolution_id: number;
  slang_id: string;
  version_number: number;
  is_current: boolean;
  editor_id: string | null;
  edit_summary: string | null;
  edit_type: 'create' | 'edit' | 'rollback' | 'restore';
  period: string | null;
  phase: string | null;
  explanation: string | null;
  example: string | null;
  origin: string | null;
  story: string | null;
  seq: number | null;
  parent_version_id: string | null;
  created_at: string;
  editor_name?: string;
}

export interface VersionDiff {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export async function getSlangVersions(slangId: string, page = 1, limit = 20): Promise<{ versions: SlangVersion[]; total: number }> {
  const offset = (page - 1) * limit;
  
  const countResult = await getQuery(
    'SELECT COUNT(*) as count FROM slang_versions WHERE slang_id = $1',
    [slangId]
  );
  const total = parseInt(countResult?.count || '0');
  
  const versions = await executeQuery<SlangVersion>(
    `SELECT sv.*, u.username as editor_name
     FROM slang_versions sv
     LEFT JOIN users u ON sv.editor_id = u.id
     WHERE sv.slang_id = $1
     ORDER BY sv.version_number DESC
     LIMIT $2 OFFSET $3`,
    [slangId, limit, offset]
  );
  
  return { versions, total };
}

export async function getSlangVersionById(versionId: string): Promise<SlangVersion | null> {
  return await getQuery<SlangVersion>(
    `SELECT sv.*, u.username as editor_name
     FROM slang_versions sv
     LEFT JOIN users u ON sv.editor_id = u.id
     WHERE sv.id = $1`,
    [versionId]
  );
}

export async function getCurrentSlangVersion(slangId: string): Promise<SlangVersion | null> {
  return await getQuery<SlangVersion>(
    `SELECT sv.*, u.username as editor_name
     FROM slang_versions sv
     LEFT JOIN users u ON sv.editor_id = u.id
     WHERE sv.slang_id = $1 AND sv.is_current = true`,
    [slangId]
  );
}

export async function createSlangVersion(
  slangId: string,
  data: {
    phrase: string;
    explanation: string;
    example?: string;
    origin?: string;
    categories?: string | string[];
    tags?: string | string[];
  },
  editorId: string | null,
  editSummary?: string,
  editType: 'create' | 'edit' | 'rollback' | 'restore' = 'edit'
): Promise<SlangVersion> {
  const conn = await beginTransaction();
  
  try {
    await executeQuery(
      'UPDATE slang_versions SET is_current = false WHERE slang_id = $1',
      [slangId]
    );
    
    const maxVersion = await getQuery<{ max: number }>(
      'SELECT COALESCE(MAX(version_number), 0) as max FROM slang_versions WHERE slang_id = $1',
      [slangId]
    );
    const versionNumber = (maxVersion?.max || 0) + 1;
    
    const categoryList = data.categories 
      ? (Array.isArray(data.categories) ? data.categories : data.categories.replace(/，/g, ',').split(',').map((c: string) => c.trim()).filter((c: string) => c))
      : [];
    const tagList = data.tags 
      ? (Array.isArray(data.tags) ? data.tags : data.tags.replace(/，/g, ',').split(',').map((t: string) => t.trim()).filter((t: string) => t))
      : [];
    
    await smartInsert('slang_versions', {
      slang_id: slangId,
      version_number: versionNumber,
      is_current: true,
      editor_id: editorId,
      edit_summary: editSummary || null,
      edit_type: editType,
      phrase: data.phrase,
      explanation: data.explanation,
      example: data.example || null,
      origin: data.origin || null,
      categories: JSON.stringify(categoryList),
      tags: JSON.stringify(tagList)
    });
    
    await smartUpdate('slang', 
      { phrase: data.phrase, explanation: data.explanation, example: data.example || null, origin: data.origin || null, categories: JSON.stringify(categoryList), tags: JSON.stringify(tagList) }, 
      'id = $1', 
      [slangId]
    );
    
    await commitTransaction(conn);
    
    return await getCurrentSlangVersion(slangId) as SlangVersion;
  } catch (error) {
    await rollbackTransaction(conn);
    throw error;
  }
}

export async function rollbackSlangVersion(versionId: string, editorId: string | null, editSummary?: string): Promise<SlangVersion> {
  const version = await getSlangVersionById(versionId);
  if (!version) {
    throw new Error('Version not found');
  }
  
  return await createSlangVersion(
    version.slang_id,
    {
      phrase: version.phrase,
      explanation: version.explanation,
      example: version.example || undefined,
      origin: version.origin || undefined,
      categories: version.categories || undefined,
      tags: version.tags || undefined
    },
    editorId,
    editSummary || `Rolled back to version ${version.version_number}`,
    'rollback'
  );
}

export function compareSlangVersions(v1: SlangVersion, v2: SlangVersion): VersionDiff[] {
  const fields = ['phrase', 'explanation', 'example', 'origin', 'categories', 'tags'] as const;
  const diffs: VersionDiff[] = [];
  
  for (const field of fields) {
    const oldValue = v1[field];
    const newValue = v2[field];
    
    if (oldValue !== newValue) {
      diffs.push({
        field,
        oldValue: oldValue || null,
        newValue: newValue || null
      });
    }
  }
  
  return diffs;
}

export async function getEvolutionVersions(evolutionId: number, page = 1, limit = 20): Promise<{ versions: EvolutionVersion[]; total: number }> {
  const offset = (page - 1) * limit;
  
  const countResult = await getQuery(
    'SELECT COUNT(*) as count FROM slang_evolution_versions WHERE evolution_id = $1',
    [evolutionId]
  );
  const total = parseInt(countResult?.count || '0');
  
  const versions = await executeQuery<EvolutionVersion>(
    `SELECT ev.*, u.username as editor_name
     FROM slang_evolution_versions ev
     LEFT JOIN users u ON ev.editor_id = u.id
     WHERE ev.evolution_id = $1
     ORDER BY ev.version_number DESC
     LIMIT $2 OFFSET $3`,
    [evolutionId, limit, offset]
  );
  
  return { versions, total };
}

export async function getEvolutionVersionsBySlangId(slangId: string): Promise<EvolutionVersion[]> {
  return await executeQuery<EvolutionVersion>(
    `SELECT ev.*, u.username as editor_name
     FROM slang_evolution_versions ev
     LEFT JOIN users u ON ev.editor_id = u.id
     WHERE ev.slang_id = $1 AND ev.is_current = true
     ORDER BY ev.seq ASC`,
    [slangId]
  );
}

export async function createEvolutionVersion(
  evolutionId: number,
  slangId: string,
  data: {
    period?: string;
    phase?: string;
    explanation?: string;
    example?: string;
    origin?: string;
    story?: string;
    seq?: number;
  },
  editorId: string | null,
  editSummary?: string,
  editType: 'create' | 'edit' | 'rollback' | 'restore' = 'edit'
): Promise<EvolutionVersion> {
  await executeQuery(
    'UPDATE slang_evolution_versions SET is_current = false WHERE evolution_id = $1',
    [evolutionId]
  );
  
  const maxVersion = await getQuery<{ max: number }>(
    'SELECT COALESCE(MAX(version_number), 0) as max FROM slang_evolution_versions WHERE evolution_id = $1',
    [evolutionId]
  );
  const versionNumber = (maxVersion?.max || 0) + 1;
  
  await smartInsert('slang_evolution_versions', {
    evolution_id: evolutionId,
    slang_id: slangId,
    version_number: versionNumber,
    is_current: true,
    editor_id: editorId,
    edit_summary: editSummary || null,
    edit_type: editType,
    period: data.period || null,
    phase: data.phase || null,
    explanation: data.explanation || null,
    example: data.example || null,
    origin: data.origin || null,
    story: data.story || null,
    seq: data.seq || null
  });
  
  return await getQuery<EvolutionVersion>(
    'SELECT * FROM slang_evolution_versions WHERE evolution_id = $1 AND is_current = true',
    [evolutionId]
  ) as EvolutionVersion;
}

export async function updateEvolutionWithVersion(
  evolutionId: number,
  slangId: string,
  data: {
    period?: string;
    phase?: string;
    explanation?: string;
    example?: string;
    origin?: string;
    story?: string;
    seq?: number;
  },
  editorId: string | null,
  editSummary?: string
): Promise<EvolutionVersion> {
  const conn = await beginTransaction();
  
  try {
    await executeQuery(
      `UPDATE slang_evolution SET 
        period = $1, phase = $2, explanation = $3, example = $4, origin = $5, story = $6, seq = $7
       WHERE id = $8`,
      [data.period || null, data.phase || null, data.explanation || null, data.example || null, data.origin || null, data.story || null, data.seq || null, evolutionId]
    );
    
    const version = await createEvolutionVersion(evolutionId, slangId, data, editorId, editSummary, 'edit');
    
    await commitTransaction(conn);
    return version;
  } catch (error) {
    await rollbackTransaction(conn);
    throw error;
  }
}
