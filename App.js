import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Alert,
  Button,
  Platform,
  View,
  Image,
} from "react-native";

import IAP from "react-native-iap";

// Platform select will allow you to use a different array of product ids based on the platform
const items = Platform.select({
  ios: [],
  android: ["rniapt_699_1m"],
});

let purchaseUpdateSubscription;
let purchaseErrorSubscription;
let img = require("./walter.jpg");

export default function App() {
  const [purchased, setPurchased] = useState(false); //set to true if the user has active subscription
  const [products, setProducts] = useState({}); //used to store list of products

  const validate = async (receipt) => {
    try {
      // send receipt to backend
      const deliveryReceipt = await fetch("add your backend link here", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ data: receipt }),
      }).then((res) => {
        res.json().then((r) => {
          // do different things based on response
          if (r.result.error == -1) {
            Alert.alert("Error", "There has been an error with your purchase");
          } else if (r.result.isActiveSubscription) {
            setPurchased(true);
          } else {
            Alert.alert("Expired", "your subscription has expired");
          }
        });
      });
    } catch (error) {
      Alert.alert("Error!", error.message);
    }
  };

  useEffect(() => {
    IAP.initConnection()
      .catch(() => {
        console.log("error connecting to store...");
      })
      .then(() => {
        IAP.getSubscriptions(items)
          .catch(() => {
            console.log("error finding items");
          })
          .then((res) => {
            setProducts(res);
          });

        IAP.getPurchaseHistory()
          .catch(() => {})
          .then((res) => {
            try {
              const receipt = res[res.length - 1].transactionReceipt;
              if (receipt) {
                validate(receipt);
              }
            } catch (error) {}
          });
      });

    purchaseErrorSubscription = IAP.purchaseErrorListener((error) => {
      if (!(error["responseCode"] === "2")) {
        Alert.alert(
          "Error",
          "There has been an error with your purchase, error code" +
            error["code"]
        );
      }
    });
    purchaseUpdateSubscription = IAP.purchaseUpdatedListener((purchase) => {
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        validate(receipt);
        IAP.finishTransaction(purchase, false);
      }
    });

    return () => {
      try {
        purchaseUpdateSubscription.remove();
      } catch (error) {}
      try {
        purchaseErrorSubscription.remove();
      } catch (error) {}
      try {
        IAP.endConnection();
      } catch (error) {}
    };
  }, []);

  if (purchased) {
    return (
      <View>
        <Text style={styles.title}>WELCOME TO THE APP!</Text>
        <Image source={img} style={{ height: 100, width: 100 }} />
      </View>
    );
  }

  if (products.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to my app!</Text>
        <Text>
          This app requires a subscription to use, a purchase of the
          subscription grants you access to the entire app
        </Text>

        {products.map((p) => (
          <Button
            key={p["productId"]}
            title={`Purchase ${p["title"]}`}
            onPress={() => {
              console.log(p["productId"]);
              IAP.requestSubscription(p["productId"]);
            }}
          />
        ))}
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <Text>Fetching products please wait...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    color: "red",
  },
});
