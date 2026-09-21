/**
 * F6-O2 — testes puros do cálculo de progresso da rampa de produção.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeProductionRampProgress,
  isProductionRampTargetPct,
} from "../../../src/lib/services/executive-dashboard/production-ramp.ts";

describe("isProductionRampTargetPct", () => {
  it("aceita apenas 10, 50 ou 100", () => {
    assert.equal(isProductionRampTargetPct(10), true);
    assert.equal(isProductionRampTargetPct(50), true);
    assert.equal(isProductionRampTargetPct(100), true);
    assert.equal(isProductionRampTargetPct(25), false);
    assert.equal(isProductionRampTargetPct("10"), false);
    assert.equal(isProductionRampTargetPct(null), false);
    assert.equal(isProductionRampTargetPct(undefined), false);
  });
});

describe("computeProductionRampProgress", () => {
  const fullScale = {
    fullScaleGuidesPerMonth: 20_000,
    fullScaleRevenuePerMonthBRL: 30_000_000,
  };

  it("calcula o alvo em 10% da escala plena corretamente", () => {
    const r = computeProductionRampProgress({
      targetPct: 10,
      ...fullScale,
      actualGuides: 1000,
      actualBilledBRL: 1_500_000,
    });
    assert.equal(r.targetGuides, 2000);
    assert.equal(r.targetRevenueBRL, 3_000_000);
    assert.equal(r.guidesProgressPct, 50);
    assert.equal(r.revenueProgressPct, 50);
  });

  it("calcula o alvo em 100% (go-live) corretamente", () => {
    const r = computeProductionRampProgress({
      targetPct: 100,
      ...fullScale,
      actualGuides: 20_000,
      actualBilledBRL: 30_000_000,
    });
    assert.equal(r.targetGuides, 20_000);
    assert.equal(r.targetRevenueBRL, 30_000_000);
    assert.equal(r.guidesProgressPct, 100);
    assert.equal(r.revenueProgressPct, 100);
  });

  it("progresso pode passar de 100% quando o real supera o alvo", () => {
    const r = computeProductionRampProgress({
      targetPct: 10,
      ...fullScale,
      actualGuides: 5000,
      actualBilledBRL: 10_000_000,
    });
    assert.ok(r.guidesProgressPct > 100);
    assert.ok(r.revenueProgressPct > 100);
  });

  it("zero real produz zero progresso, nunca divide por zero", () => {
    const r = computeProductionRampProgress({
      targetPct: 50,
      ...fullScale,
      actualGuides: 0,
      actualBilledBRL: 0,
    });
    assert.equal(r.guidesProgressPct, 0);
    assert.equal(r.revenueProgressPct, 0);
  });

  it("escala plena zerada não gera NaN/Infinity — progresso cai para 0", () => {
    const r = computeProductionRampProgress({
      targetPct: 10,
      fullScaleGuidesPerMonth: 0,
      fullScaleRevenuePerMonthBRL: 0,
      actualGuides: 100,
      actualBilledBRL: 100,
    });
    assert.equal(r.targetGuides, 0);
    assert.equal(r.targetRevenueBRL, 0);
    assert.equal(r.guidesProgressPct, 0);
    assert.equal(r.revenueProgressPct, 0);
  });
});
