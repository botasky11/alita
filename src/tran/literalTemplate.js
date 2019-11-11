/**
 * Copyright (c) Areslabs.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import traverse from "@babel/traverse";
import * as t from "@babel/types"
import {isTextElement} from '../util/uast'

/**
 * 如果 由childrenToTemplate生成的template 最终运行的结果是literal，那直接展示
 * @param ast
 * @param info
 * @returns {*}
 */
export default function literalTemplate (ast, info) {

    traverse(ast, {
        exit: path => {
            if (path.type === 'JSXElement'
                && isTextElement(path.node.openingElement)
            ) {

                const children = path.node.children
                path.node.children = children.map(item => {
                    if (
                        item.type === 'JSXElement'
                        && item.openingElement.name.name === 'template'
                    ) {

                        let datakey = null
                        item.openingElement.attributes.forEach(attr => {
                            if (attr.type === 'JSXAttribute' && attr.name.name === 'datakey') {
                                datakey = attr.value.value
                            }
                        })

                        return t.jsxText(`{{${datakey}}}`)
                    } else {
                        return item
                    }
                })
            }

        }

    })

    return ast
}
