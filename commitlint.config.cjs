module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'style', 'refactor', 'test', 'docs']],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 72],
  },
};
