/**
 * Deal structuring arithmetic for an Indian listed target. A simplified reading
 * of the SEBI takeover, minimum-public-shareholding and delisting thresholds;
 * it is a screening aid, not legal advice or an offer-price determination.
 */
export const TAKEOVER_RULES = Object.freeze({
  /** Voting rights at or above which an open offer is mandatory. */
  openOfferTriggerPct: 25,
  /** Minimum open offer size, as a percentage of total shares. */
  openOfferSizePct: 26,
  /** Ceiling on non-public (promoter and acquirer) holding of a listed company. */
  maxNonPublicPct: 75,
  /** Acquirer and promoter holding needed for a delisting offer to succeed. */
  delistingThresholdPct: 90,
});
export const DEFAULT_CONTROL_PREMIUM = 0.2;

export interface TakePrivateInput {
  /** Undisturbed market capitalisation, INR crore. */
  marketCap: number;
  /** Promoter group holding, percent of total shares. */
  promoterPct: number;
  /** Pledged promoter shares, percent. */
  pledgedPct: number;
  debt: number;
  cash: number;
  /** Normalized EBITDA used for the implied multiple. */
  ebitda: number;
  /** Premium to the undisturbed price, as a decimal, paid on every share bought. */
  premium: number;
  /** Fraction of the promoter holding sold to the acquirer. Default: all of it. */
  promoterStakeSold?: number;
  /** Fraction of the open offer that public shareholders tender. Default: all of it. */
  acceptance?: number;
  /** Absolute share count, for a per-share offer price. */
  shares?: number;
}
export interface DealFlag {
  code:
    | "open-offer"
    | "no-control"
    | "public-float-breach"
    | "listed-minorities"
    | "pledge-release"
    | "below-market"
    | "squeeze-out";
  message: string;
}

const pct = (v: number) => `${v.toFixed(1)}%`;

/** Implied EV / EBITDA when the whole company is bought at market plus a premium. */
export function impliedEntryMultiple(
  target: Pick<TakePrivateInput, "marketCap" | "debt" | "cash" | "ebitda">,
  premium: number,
) {
  if (
    ![target.marketCap, target.debt, target.cash, target.ebitda, premium].every(
      Number.isFinite,
    ) ||
    target.marketCap <= 0 ||
    target.ebitda <= 0 ||
    premium <= -1
  )
    throw new Error("Invalid market pricing inputs");
  return (
    (target.marketCap * (1 + premium) + target.debt - target.cash) /
    target.ebitda
  );
}

export function takePrivate(input: TakePrivateInput) {
  const { promoterStakeSold = 1, acceptance = 1 } = input;
  const R = TAKEOVER_RULES;
  if (
    ![input.promoterPct, input.pledgedPct, promoterStakeSold, acceptance].every(
      Number.isFinite,
    ) ||
    input.promoterPct < 0 ||
    input.promoterPct > 100 ||
    input.pledgedPct < 0 ||
    input.pledgedPct > 100 ||
    promoterStakeSold < 0 ||
    promoterStakeSold > 1 ||
    acceptance < 0 ||
    acceptance > 1
  )
    throw new Error("Invalid ownership or tender inputs");
  const entryMultiple = impliedEntryMultiple(input, input.premium);
  const equityValue = input.marketCap * (1 + input.premium);
  const block = input.promoterPct * promoterStakeSold;
  const retainedPromoter = input.promoterPct - block;
  const publicFloat = 100 - input.promoterPct;
  // Buying promoter shares is treated as a change of control whatever the size.
  const openOffer = block > 0;
  const offerSize = openOffer ? Math.min(R.openOfferSizePct, publicFloat) : 0;
  const tendered = offerSize * acceptance;
  const stake = block + tendered;
  const nonPublic = stake + retainedPromoter;
  const stakes = {
    minimum: block,
    expected: stake,
    maximum: block + offerSize,
  };
  const cost = (holding: number) => (equityValue * holding) / 100;
  const delistingGap = Math.max(0, R.delistingThresholdPct - nonPublic);
  const remainingPublic = 100 - nonPublic;
  const flags: DealFlag[] = [];
  if (input.premium < 0)
    flags.push({
      code: "below-market",
      message:
        "Offer is below the undisturbed market price; public shareholders have no reason to tender and the open-offer floor price is unlikely to be met.",
    });
  if (openOffer)
    flags.push({
      code: "open-offer",
      message: `Buying ${pct(block)} from promoters triggers a mandatory open offer for ${pct(offerSize)} of the company at no less than the negotiated price.`,
    });
  if (stake < 50)
    flags.push({
      code: "no-control",
      message: `Expected holding of ${pct(stake)} is short of a simple majority; control depends on board rights and the tender outcome.`,
    });
  if (nonPublic > R.maxNonPublicPct && nonPublic < R.delistingThresholdPct)
    flags.push({
      code: "public-float-breach",
      message: `Non-public holding of ${pct(nonPublic)} exceeds the ${R.maxNonPublicPct}% ceiling without reaching the ${R.delistingThresholdPct}% delisting threshold; ${pct(nonPublic - R.maxNonPublicPct)} must be sold down or a delisting offer made.`,
    });
  if (nonPublic < R.delistingThresholdPct)
    flags.push({
      code: "listed-minorities",
      message:
        "The target stays listed with minority shareholders. Acquisition debt cannot be serviced from, or secured on, target cash flows as the 100% model assumes; returns depend on dividends and the holding-company structure.",
    });
  else if (nonPublic < 100)
    flags.push({
      code: "squeeze-out",
      message: `Delisting threshold reached, but ${pct(100 - nonPublic)} remains with residual shareholders who keep an exit right after delisting.`,
    });
  if (input.pledgedPct > 0 && block > 0)
    flags.push({
      code: "pledge-release",
      message: `${pct(input.pledgedPct)} of promoter shares are pledged; lender release is a condition to transferring the block.`,
    });
  return {
    premium: input.premium,
    /** 100% equity value at the offer price, INR crore. */
    equityValue,
    enterpriseValue: equityValue + input.debt - input.cash,
    entryMultiple,
    offerPricePerShare:
      input.shares && input.shares > 0
        ? (equityValue * 1e7) / input.shares
        : null,
    promoterBlockPct: block,
    retainedPromoterPct: retainedPromoter,
    publicFloatPct: publicFloat,
    openOffer: {
      required: openOffer,
      sizePct: offerSize,
      tenderedPct: tendered,
      /** Cash to fund full acceptance; the offer must be backed for this amount. */
      maximumCost: cost(offerSize),
    },
    stakePct: stakes,
    /** Equity purchase cost before fees, INR crore, by tender outcome. */
    cost: {
      minimum: cost(stakes.minimum),
      expected: cost(stakes.expected),
      maximum: cost(stakes.maximum),
      fullCompany: equityValue,
    },
    nonPublicPct: nonPublic,
    control: stake >= 50,
    delisting: {
      thresholdPct: R.delistingThresholdPct,
      reached: delistingGap === 0,
      /** Further shares needed from the public, percent of total shares. */
      additionalPct: delistingGap,
      /** The same requirement as a share of the public float left after the offer. */
      shareOfRemainingPublic:
        delistingGap === 0
          ? 0
          : remainingPublic > 0
            ? delistingGap / remainingPublic
            : null,
    },
    flags,
  };
}
export type TakePrivate = ReturnType<typeof takePrivate>;
