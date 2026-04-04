const admin = require('firebase-admin');

// Aapki JSON file se li gayi details
const serviceAccount = {
  "type": "service_account",
  "project_id": "earn-bot-2026",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqQF3dojDh7Ig3\nrmc3KLzPPRSsaSIoNKOAP+S+i6nEhI8/s64EOsOy/b3UowwRDkcOLB+2C0nBRYwW\nabfTBb6JxlVPO5Gre1Z04azIiYmlSY0sPmAxOioL3SmhjolGTvABnrOpBe6XYXxo\ngzOZVFFbEZnHWNlj7VGWJpnY1fCvQh6RvcLH78vdsonhw/QdfysP/hI9h7DPEIlI\nsKAipVAaHxPQTZUpUCexvA5HxR8DT+Lb2OWre6fk+Gb7qK/qSFN+3E/ZCo/z7axK\n185GLPFEPRrMVWyWwVopTr3qwiKyESX385OqNJi7xz6Wruosq2ewvH9q0cJqBIAt\n3Pht/34ZAgMBAAECggEAPSSVsWGs3Y51k026utgSCvlcQdkWD8trxsTrkTUWWMHk\nslOE1PcHznILaWDPFhcDFMdq8hWWvOcNuwTnpE0lU1Sb0bNKiwPmFl7wDys5+Fb0\ncOXL5RIHBLC+YUuP6GS0FFjbHAJJ4Cr+I4ivEMtz1ll5WVsC47zYtqyRRwr6f+4Q\ngZ9+LXMgDDpgFVBL6oBtrHDgbF/Y5D3urQgnCIxGhLbNCO5E4nhPOHBPBL+VpUDW\n0p9KuT9xzAvczehsgw4+4cu1szSjbOarQLnPuAcYsZS8CZ9+DLW6m7TSSEFACBNP\nX7Z5KPDU7Oi0fBNzyylgnB/xILYy9yk0TAF8qRfTGwKBgQDYOzJ3kN/SxYifpFEj\nZbZOFY5NqoFpauGWHPDj9jbIRN8fFGBOzM1X1GdcgyoiMDWjVt8/3GWG4VwJDW4W\nTCNMjsV1NuYHXOa2uvVU4QX4Dn8iarhcP0LjMp4ALXfaZGsnJf/yIabDIAQ3vwyu\np2mAOHXnlSoEFqFN2cGOFs8AFwKBgQDJkE4SJqbM8oaSBxqwiS9bq/irUj7JNwZw\nv51Mc3xsxZbdHkKPrcNwe+AFL7fgmIl3nHInD+H4GfXzAQbfCeXEzS3vOre7db+y\n3fv5q+hHEw/6vNd7GDiYOEyvsl04nC9+eXtpdZtcbwZBxPQhVWXjCZwm8B7FXU+G\nyLU6DXChTwKBgQDFqY+ftyKz5PjYnnfBeOgnBxN3sebs+9RNyhT2/orjlfm0yoaj\nYhpQMI1wB0MLz7AoqXAZS5rPqtDcQZeh8GXQRS8B0HaEworw/YTo227+bBoR1ybC\nxN2bHRlMJkRKssM1HUqUB+kOtATHBPFN8yHBIVu+oB+xbxJzPRzvi7AcbwKBgE/K\nHw2SXV8t9lViGI+fjq60UdjH0vDmJleFkqgL40pPoVvguaqUt5QUhWaoMBrpZymB\nNbL+143WAQVz95tdGKaiLjfQP6EmiH8u3qtEAMv54M556LbirKydRMYcTki1kxt2\nzYK+uoSJsqlgZN+5JX8Nc9H6JcQtHukVFKBpZ5eDAoGAbH2caA30uz/7n1a6+csE\nv3thDbu8LiUMg1Jvyja/5LSdYyJZaHRBhIaV246SlukAJm3ZHAqXsCA7oEtzWyAR\nR8f1GyM/ZzyV2zy5+1gguDw2qoShAy22jfKD7GxWCDo9KN+fF+cRpRj3Mgrl/EBA\nI5XIf7Wywpaqy01NAtky+DM=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@earn-bot-2026.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://earn-bot-2026-default-rtdb.firebaseio.com"
    });
}

const db = admin.firestore();
module.exports = { db, admin };
