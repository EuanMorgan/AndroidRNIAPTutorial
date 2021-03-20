const functions = require("firebase-functions");
const { google } = require("googleapis");

exports.validate = functions
  .region("europe-west2")
  .https.onCall(async (data) => {
    functions.logger.info(data, { structuredData: true });
    const auth = new google.auth.GoogleAuth({
      keyFile: "insert-your-keyfile-here... or use a secret manager :)",
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });
    functions.logger.info(JSON.parse(data)["purchaseToken"], {
      structuredData: true,
    });

    try {
      const res = await google
        .androidpublisher("v3")
        .purchases.subscriptions.get({
          packageName: "insert-your-package-name-here",
          subscriptionId: JSON.parse(data)["productId"],
          token: JSON.parse(data)["purchaseToken"],
          auth: auth,
        });
      functions.logger.info(res, {
        structuredData: true,
      });
      if (res.status == 200) {
        functions.logger.info(res.data.paymentState === 1, {
          structuredData: true,
        });
        return { isActiveSubscription: res.data.paymentState === 1 };
      }
      return { error: -1 };
    } catch (error) {
      functions.logger.error(error, {
        structuredData: true,
      });
      return { error: -1 };
    }
  });
