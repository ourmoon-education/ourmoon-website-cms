# Directus Extensions

Custom extensions for the OurMoon Directus instance.

## Structure

Each extension is a subdirectory with its own `package.json` following the Directus extensions SDK pattern.

## Building

Extensions are built into the Docker image at deploy time:
```bash
docker build -t ourmoon-directus .
```

## Development

To develop extensions locally:
```bash
cd extensions/lucide-icon-picker
npm install
npm run dev  # watches and rebuilds
```
