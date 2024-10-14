const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  let workerIndex = 0;

  console.log(`Master ${process.pid} is running`);


  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }


  const workers = Object.values(cluster.workers);

  const getWorker = (socket) => {
    const worker = workers[workerIndex];
    workerIndex = (workerIndex + 1) % workers.length;
    return worker;
  };

  const server = http.createServer((req, res) => {
    getWorker().send('handleRequest', { req, res });
  }).listen(8000);

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  process.on('message', (message, data) => {
    if (message === 'handleRequest') {
      const { req, res } = data;
      res.writeHead(200);
      res.end(`Handled by worker ${process.pid}`);
    }
  });

  console.log(`Worker ${process.pid} started`);
}