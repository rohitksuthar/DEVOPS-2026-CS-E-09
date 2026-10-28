
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 5 },
    { duration: '40s', target: 5 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const response = http.get('http://localhost:4000/');

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
