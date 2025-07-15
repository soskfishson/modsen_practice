module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
                diagnostics: {
                    ignoreCodes: [151001],
                },
            },
        ],
    },
    preset: 'ts-jest',
    collectCoverageFrom: [
        'src/**/*.(t|j)s',
        '!src/main.ts',
        '!src/**/*.module.ts',
        '!src/**/*.dto.ts',
        '!src/**/*.entity.ts',
        '!src/**/constants/*.*',
        '!src/config/*.*',
    ],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
};
