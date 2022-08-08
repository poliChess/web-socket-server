import { loadPackageDefinition, credentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

let client: any = null;

function init() {
  const packageDefinition = loadSync(
    './src/grpc/service.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto: any = loadPackageDefinition(packageDefinition).api;

  client = new proto.ServiceDiscovery('discovery-service:3000', credentials.createInsecure());
}

function register(serviceName: string, serviceAddr: string) {
  if (client === null)
    init();

  const payload = {
    serviceName,
    serviceAddr,
  };

  client?.register(payload, (err: any, res: any) => {
    if (err !== null) {
      console.warn(err);
      return setTimeout(() => register(serviceName, serviceAddr), 1000);
    }

    if (!res.success) {
      console.warn(res.message);
      return setTimeout(() => register(serviceName, serviceAddr), 1000);
    }

    return;
  })
}

async function get(serviceName: string) {
  if (client === null)
    init();

  const payload = {
    serviceName,
  };

  return new Promise<any>((resolve, reject) => {
    client?.get(payload, (err: any, res: any) => {
      if (err) return reject(err);
      return resolve(res);
    })
  })
}

export default { register, get }
