import {
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

/*
 * Minimal fixture adapted from pbi-lineage-lenz/samples/sample-pbip.
 * Upstream commit: 7e2c61cac2f5e0ca6e7135df17a6918c89c42aec
 * License: MIT, Copyright (c) Jihwan Kim.
 */
const SALES_TMDL = `table Sales
\tcolumn OrderDate
\t\tdataType: dateTime
\t\tsourceColumn: OrderDate
\tcolumn Amount
\t\tdataType: decimal
\t\tsourceColumn: Amount
\tcolumn ProductID
\t\tdataType: int64
\t\tsourceColumn: ProductID
\tmeasure 'Total Sales' = SUM(Sales[Amount])
\t\tformatString: $#,##0.00
\tmeasure 'Unused Metric' = COUNTROWS(Sales) * 0
\t\tformatString: #,##0
`;

const PRODUCTS_TMDL = `table Products
\tcolumn ProductID
\t\tdataType: int64
\t\tsourceColumn: ProductID
\tcolumn Category
\t\tdataType: string
\t\tsourceColumn: Category
`;

const PAGE_JSON = JSON.stringify({
  displayName: 'Sales Overview',
  visibility: 'Visible',
  order: 0,
  width: 1280,
  height: 720,
});

const VISUAL_JSON = JSON.stringify({
  name: 'visual1',
  visual: {
    visualType: 'clusteredBarChart',
    title: 'Sales by Category',
    prototypeQuery: {
      Version: 2,
      From: [
        { Name: 'p', Entity: 'Products', Type: 0 },
        { Name: 's', Entity: 'Sales', Type: 0 },
      ],
      Select: [
        {
          Column: {
            Expression: { SourceRef: { Source: 'p' } },
            Property: 'Category',
          },
          Name: 'Products.Category',
        },
        {
          Measure: {
            Expression: { SourceRef: { Source: 's' } },
            Property: 'Total Sales',
          },
          Name: 'Sales.Total Sales',
        },
      ],
    },
  },
  position: {
    x: 48,
    y: 64,
    width: 720,
    height: 420,
  },
});

const DEFINITION_PBIR = JSON.stringify({
  version: '4.0',
  datasetReference: {
    byPath: {
      path: '../Sample.SemanticModel',
    },
  },
});

export function writePbipFixture(root) {
  const modelTables = join(
    root,
    'Sample.SemanticModel',
    'definition',
    'tables',
  );
  const visualDirectory = join(
    root,
    'Sample.Report',
    'definition',
    'pages',
    'page1',
    'visuals',
    'visual1',
  );
  const pageDirectory = join(
    root,
    'Sample.Report',
    'definition',
    'pages',
    'page1',
  );

  mkdirSync(modelTables, { recursive: true });
  mkdirSync(visualDirectory, { recursive: true });

  writeFileSync(join(modelTables, 'Sales.tmdl'), SALES_TMDL, 'utf-8');
  writeFileSync(
    join(modelTables, 'Products.tmdl'),
    PRODUCTS_TMDL,
    'utf-8',
  );
  writeFileSync(
    join(root, 'Sample.Report', 'definition.pbir'),
    DEFINITION_PBIR,
    'utf-8',
  );
  writeFileSync(
    join(pageDirectory, 'page.json'),
    PAGE_JSON,
    'utf-8',
  );
  writeFileSync(
    join(visualDirectory, 'visual.json'),
    VISUAL_JSON,
    'utf-8',
  );
}
