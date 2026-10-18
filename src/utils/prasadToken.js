const getRawPrasadQuantities = (donation) => {
  if (
    donation?.calculationVersion === "category-v2" &&
    donation.prasadEntitlement
  ) {
    return {
      grams: Number(donation.prasadEntitlement.grams) || 0,
      packets: Number(donation.prasadEntitlement.packets) || 0,
    };
  }

  return (donation?.list || []).reduce(
    (totals, item) => {
      const quantity = Number(item.quantity) || 0;
      if (item.isPacket) totals.packets += quantity;
      else totals.grams += quantity;
      return totals;
    },
    { grams: 0, packets: 0 }
  );
};

const getPrasadQuantities = (donation) => {
  const quantities = getRawPrasadQuantities(donation);
  const fulfillmentType = donation?.mahaprasadFulfillment?.type;

  if (fulfillmentType === "halwa") {
    return { grams: quantities.grams, packets: 0 };
  }
  if (fulfillmentType === "packet") {
    return { grams: 0, packets: quantities.packets };
  }
  if (fulfillmentType === "mixed") return quantities;
  if (fulfillmentType === "none") return { grams: 0, packets: 0 };

  return quantities;
};

const canDownloadPrasadToken = (donation) => {
  const fulfillmentType = donation?.mahaprasadFulfillment?.type;
  if (
    donation?.donatedAs === "child" ||
    donation?.mahaprasadFulfillment?.mode !== "collection" ||
    !["halwa", "packet", "mixed"].includes(fulfillmentType)
  ) {
    return false;
  }

  const { grams, packets } = getPrasadQuantities(donation);
  return grams > 0 || packets > 0;
};

export { canDownloadPrasadToken, getPrasadQuantities };
