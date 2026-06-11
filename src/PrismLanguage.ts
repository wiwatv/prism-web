import { Monaco } from '@monaco-editor/react';

export function registerPrismLanguage(monaco: Monaco) {
  if (monaco.languages.getLanguages().some(lang => lang.id === 'prism')) {
    return;
  }

  monaco.languages.register({ id: 'prism' });

  monaco.languages.setMonarchTokensProvider('prism', {
    keywords: [
      'pta', 'dtmc', 'ctmc', 'mdp', 'module', 'endmodule', 'system', 'endsystem',
      'init', 'endinit', 'rewards', 'endrewards', 'formula', 'label', 'const',
      'int', 'bool', 'double', 'clock', 'invariant', 'true', 'false', 'global',
      'A', 'E', 'P', 'R', 'S', 'Pmin', 'Pmax', 'Rmin', 'Rmax', 'F', 'G', 'X', 'U', 'W'
    ],
    operators: [
      '=', '!=', '<', '<=', '>', '>=', '+', '-', '*', '/', '&', '|', '!', '=>', '?', ':', '..', '->'
    ],
    symbols:  /[=><!~?:&|+\-*\/\^%]+/,
    
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
        { include: '@whitespace' },
        [/[{}()\[\]]/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],
        [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
        [/\d+/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }]
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment']
      ],
      comment: [
        [/[^\/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape.invalid'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ]
    }
  });

  monaco.languages.setLanguageConfiguration('prism', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
  });
}
