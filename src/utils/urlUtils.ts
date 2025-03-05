export function extractOriginalIds(canvas: ManifestCanvas): { originalCanvasId: string; originalManifestId: string } {
  // Find the first annotation with painting motivation
  const paintingAnnotation = canvas.items?.[0]?.items?.find(
    item => item.motivation === 'painting'
  );

  if (!paintingAnnotation?.target) {
    throw new Error('No painting annotation target found in canvas');
  }

  const target = paintingAnnotation.target;
  const matches = target.match(/\/iiif\/2\.0\/(\d+)\/canvas\/\d+\.json$/);
  
  if (!matches) {
    throw new Error(`Unable to extract original IDs from target: ${target}`);
  }

  const manifestId = matches[1];
  
  return {
    originalCanvasId: target,
    originalManifestId: `https://damsssl.llgc.org.uk/iiif/2.0/${manifestId}/manifest.json`
  };
}