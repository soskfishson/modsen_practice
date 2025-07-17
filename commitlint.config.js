module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'header-max-length': [2, 'always', 100],
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'chore',
                'docs',
                'style',
                'refactor',
                'perf',
                'test',
                'build',
                'ci',
                'revert',
            ],
        ],
    },
};
