
export type UpdateSamlMetadataXmlFormState = {
    idpEntityId: string;
    idpSsoUrl: string;
    idpSigningCert01: string;
    idpSigningCert02: string;
    idpMetadataUrl: string;
  };

// Basic, resilient parser for SAML 2.0 IdP metadata XML
// Extracts entityID, SingleSignOnService Location, and up to two X509Certificate blocks
export function parseSamlMetadataXml(xml: string): UpdateSamlMetadataXmlFormState {
  const entityIdMatch = xml.match(/entityID=\"([^\"]+)\"/i);
  const ssoUrlMatch = xml.match(/SingleSignOnService[^>]*Location=\"([^\"]+)\"/i);
  // Support optional XML namespace prefix, e.g., <ds:X509Certificate>
  const certMatches = Array.from(
    xml.matchAll(/<\s*(?:[\w-]+:)?X509Certificate\s*>\s*([\s\S]*?)\s*<\s*\/\s*(?:[\w-]+:)?X509Certificate\s*>/gi)
  ).map(m => (m[1] || '').replace(/\s+/g, ''));

  const idpEntityId = entityIdMatch ? entityIdMatch[1] : '';
  const idpSsoUrl = ssoUrlMatch ? ssoUrlMatch[1] : '';
  const idpSigningCert01 = certMatches[0] || '';
  const idpSigningCert02 = certMatches[1] || '';

  return {
    idpEntityId,
    idpSsoUrl,
    idpSigningCert01,
    idpSigningCert02,
    idpMetadataUrl: '',
  };
}