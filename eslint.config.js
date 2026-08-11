//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // Les artefacts de build ne sont pas du code source : sans cette exclusion,
    // `pnpm lint` echoue sur le JS genere dans .output.
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      '.output/**',
      '.nitro/**',
      'dist/**',
      'src/routeTree.gen.ts',
      // Fichiers shadcn, regeneres par `pnpm shadcn add` : leur style ne nous
      // appartient pas.
      'src/shared/components/ui/**',
    ],
  },
]
