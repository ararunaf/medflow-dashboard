/**
 * XMLGenericValidator — D-11 Enterprise XML Validation Runtime Functional Foundation.
 *
 * Orquestra as capabilities D-01 a D-10 para uma validação genérica XML.
 * Sem TISS. Sem ANS. Sem Operadoras. Sem Workflow.
 */
import type { CanonicalXMLDocument } from "../../xml-runtime/parser/canonical";
import { XMLAutomaticCorrector } from "../automatic-correction/xml-automatic-correction-engine";
import { BusinessValidator } from "../business-validation/business-validator";
import { NamespaceValidator } from "../namespace-validation/namespace-validator";
import { OperatorValidator } from "../operator-validation/operator-validator";
import { VersionValidator } from "../version-validation/version-validator";
import { XMLRepairEngine } from "../xml-repair/xml-repair-engine";
import { XSDValidator } from "../xsd-validation/xsd-validator";
import type {
  CanonicalGenericXMLValidationReport,
  CanonicalGenericXMLValidationReportItem,
  CanonicalGenericXMLValidationResult,
  XMLGenericValidationOptions,
  XMLGenericValidationRules,
} from "./canonical";
import { createEmptyGenericXMLValidationContext } from "./canonical";

export type XMLGenericValidatorInput = {
  document: CanonicalXMLDocument;
  options?: XMLGenericValidationOptions;
  rules?: XMLGenericValidationRules;
};

/**
 * Orquestrador genérico de validação XML (D-11).
 */
export class XMLGenericValidator {
  private readonly xsdValidator = new XSDValidator();
  private readonly namespaceValidator = new NamespaceValidator();
  private readonly versionValidator = new VersionValidator();
  private readonly businessValidator = new BusinessValidator();
  private readonly operatorValidator = new OperatorValidator();
  private readonly repairEngine = new XMLRepairEngine();
  private readonly corrector = new XMLAutomaticCorrector();

  validate(input: XMLGenericValidatorInput): CanonicalGenericXMLValidationResult {
    const { document, options = {}, rules = {} } = input;
    let workingDocument: CanonicalXMLDocument = structuredClone(document) as CanonicalXMLDocument;

    const xsd = options.xsd
      ? this.xsdValidator.validate(workingDocument, rules.xsdSchema ?? "", {
          rootElementName: workingDocument.rootNode?.localName,
        })
      : undefined;

    const namespace = options.namespace
      ? this.namespaceValidator.validate(workingDocument, {
          namespaceUri: rules.namespaceExpected ?? "",
          rootElementName: workingDocument.rootNode?.localName,
        })
      : undefined;

    const version = options.version
      ? this.versionValidator.validate(workingDocument, {
          versionId: rules.versionExpected ?? "",
          rootElementName: workingDocument.rootNode?.localName,
        })
      : undefined;

    const business = options.business
      ? this.businessValidator.validate(workingDocument, {
          rules: rules.businessRules ?? [],
          rootElementName: workingDocument.rootNode?.localName,
        })
      : undefined;

    const operator = options.operator
      ? this.operatorValidator.validate(workingDocument, {
          operatorId: rules.operatorExpected ?? "",
          rootElementName: workingDocument.rootNode?.localName,
        })
      : undefined;

    const repair =
      options.repair && rules.repairRules
        ? this.repairEngine.repair(workingDocument, { rules: rules.repairRules })
        : undefined;
    if (repair?.repaired && repair.document) {
      workingDocument = repair.document;
    }

    const correction =
      options.correction && rules.correctionRules
        ? this.corrector.correct(workingDocument, { rules: rules.correctionRules })
        : undefined;
    if (correction?.corrected && correction.document) {
      workingDocument = correction.document;
    }

    const reportItems: CanonicalGenericXMLValidationReportItem[] = [];
    if (xsd)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "xsd",
        ok: xsd.valid === true,
        code: xsd.code,
        message: xsd.message,
      });
    if (namespace)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "namespace",
        ok: namespace.valid === true,
        code: namespace.code,
        message: namespace.message,
      });
    if (version)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "version",
        ok: version.valid === true,
        code: version.code,
        message: version.message,
      });
    if (business)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "business",
        ok: business.valid === true,
        code: business.code,
        message: business.message,
      });
    if (operator)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "operator",
        ok: operator.valid === true,
        code: operator.code,
        message: operator.message,
      });
    if (repair)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "repair",
        ok: repair.ok,
        code: repair.code,
        message: repair.message,
      });
    if (correction)
      reportItems.push({
        kind: "canonical-generic-xml-validation-report-item",
        operation: "correction",
        ok: correction.ok,
        code: correction.code,
        message: correction.message,
      });

    const allOk = reportItems.length === 0 || reportItems.every((i) => i.ok);

    const report: CanonicalGenericXMLValidationReport | undefined = options.report
      ? { kind: "canonical-generic-xml-validation-report", ok: allOk, items: reportItems }
      : undefined;

    const context = createEmptyGenericXMLValidationContext({
      document: workingDocument,
      options,
    });

    return {
      kind: "canonical-generic-xml-validation-result",
      ok: allOk,
      document: workingDocument,
      xsd,
      namespace,
      version,
      business,
      operator,
      repair,
      correction,
      report,
      context,
      code: allOk ? "XML_GENERIC_VALIDATION_OK" : "XML_GENERIC_VALIDATION_HAS_FAILURES",
      message: allOk
        ? "Generic XML validation completed with all enabled checks passing."
        : `Generic XML validation completed with ${reportItems.filter((i) => !i.ok).length} failure(s).`,
    };
  }
}
