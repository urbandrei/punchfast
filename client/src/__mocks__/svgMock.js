/**
 * Mock for SVG files imported as React components
 *
 * This mock provides both a default export (URL string) and
 * a ReactComponent named export (mock React component).
 */

import React from 'react';

const SvgMock = React.forwardRef((props, ref) => (
  <svg ref={ref} data-testid="svg-mock" {...props} />
));

SvgMock.displayName = 'SvgMock';

export const ReactComponent = SvgMock;
export default 'test-file-stub';
