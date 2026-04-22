import { config, hasSupabaseConfig } from '../config.js';
import { createMemoryRepository } from './memory-repository.js';
import { createSupabaseRepository } from './supabase-repository.js';

let repository;

export function getRepository() {
  if (!repository) {
    repository = hasSupabaseConfig()
      ? createSupabaseRepository({
          supabaseUrl: config.supabaseUrl,
          serviceRoleKey: config.supabaseServiceRoleKey || config.supabaseAnonKey
        })
      : createMemoryRepository();
  }
  return repository;
}