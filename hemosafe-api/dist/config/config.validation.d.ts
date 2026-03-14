declare enum Environment {
    Development = "development",
    Production = "production",
    Test = "test"
}
declare class EnvironmentVariables {
    NODE_ENV: Environment;
    PORT: number;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_ACCESS_EXPIRES: string;
    JWT_REFRESH_EXPIRES: string;
    FRONTEND_URL: string;
    RATE_LIMIT_MAX: number;
}
export declare function validate(config: Record<string, unknown>): EnvironmentVariables;
export {};
