import importlib.machinery
import importlib.util
import json
from pathlib import Path
import threading
import unittest
from http.server import HTTPServer, BaseHTTPRequestHandler
from unittest.mock import patch

loader = importlib.machinery.SourceFileLoader('connector', str(Path(__file__).parents[1] / 'integrations/wazuh/custom-secureweb'))
spec = importlib.util.spec_from_loader(loader.name, loader)
connector = importlib.util.module_from_spec(spec)
loader.exec_module(connector)


class ConnectorTests(unittest.TestCase):
    def test_http_delivery_auth_retry_and_redirect(self):
        received = []
        statuses = [503, 201, 401, 302]

        class Handler(BaseHTTPRequestHandler):
            def do_POST(self):
                received.append((self.headers.get('X-Wazuh-Key'), json.loads(self.rfile.read(int(self.headers['Content-Length'])))))
                self.send_response(statuses.pop(0))
                self.send_header('Location', '/must-not-follow')
                self.end_headers()

            def log_message(self, *args):
                pass

        server = HTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        url = f'http://127.0.0.1:{server.server_port}/api/webhooks/wazuh'
        key = 'only-an-isolated-test-key-1234567890'
        try:
            with patch.object(connector.time, 'sleep'):
                connector.send_alert({'id': 'test'}, key, url)
                self.assertEqual(len(received), 2)
                self.assertEqual(received[0], (key, {'id': 'test'}))
                with self.assertRaisesRegex(RuntimeError, '401'):
                    connector.send_alert({'id': 'test'}, key, url)
                self.assertEqual(len(received), 3)
                with self.assertRaisesRegex(RuntimeError, '302'):
                    connector.send_alert({'id': 'test'}, key, url)
                self.assertEqual(len(received), 4)
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_invalid_url_and_short_key(self):
        for url, key in [('file:///tmp/no', 'x' * 32), ('http://user:pass@localhost', 'x' * 32), ('http://localhost', 'short')]:
            with self.assertRaises(ValueError):
                connector.send_alert({}, key, url)


if __name__ == '__main__':
    unittest.main()
