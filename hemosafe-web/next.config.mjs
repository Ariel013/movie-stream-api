

const nextConfig = {
  output: 'standalone', // required for Docker minimal image
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'ui-avatars.com' },
    ],
  },
};

export default nextConfig;
