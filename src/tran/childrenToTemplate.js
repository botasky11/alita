/**
 * Copyright (c) Areslabs.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import errorLogTraverse from '../util/ErrorLogTraverse'
import * as t from "@babel/types"

import {geneOrder} from '../util/util'
import {isChildComp, isTextElement} from '../util/uast'

import {ChildTemplateDataKeyPrefix, ChildTemplateNamePrefix} from '../constants'

/**
 * JSXElement children转化为 child template
 *
 * 1. 自身
 * <V>
 *     {a}
 *     {x && this.f()}
 * </V>
 *
 * 转化为
 * <V>
 *     <template
 *         is="child"
 *         data=""
 *         tempVnode={a}
 *     />
 *     <template
 *         is="child"
 *         data=""
 *         tempVnode={x && this.f()}
 *     />
 * </V>
 *
 *
 * * 名为child 的template 如下：
 * <template name="child">
     <block wx:if="{{isArray}}">
         <block wx:for="{{v}}" wx:key="key">
              <template is="{{item.tempName}}" data="{{...item}}"></template>
         </block>
     </block>
     <block wx:elif="{{isJSX}}">
          <template is="{{v.tempName}}" data="{{...v}}"></template>
     </block>
     <block wx:elif="{{isLiteral}}">
         {{v}}
     </block>
 </template>
 *
 * 2. 属性传递
 * 注意， 对于属性传递的组件， 只支持作为 JSXElement child这种形式
 * <V>
 *     {this.props.f()}
 * </V>
 *
 * 转化为：
 * <V>
 *     <template
 *         is="fCPTchild"
 *         tempVnode={() => {
 *             const v = this.props.f()
 *
 *             if (v not reactElement) {
 *                 return v
 *             }
 *
 *             return <fCPT diuu='xx'/>
 *         }}
 *     />
 * </V>
 *
 * 名为child 的template 如下：
 * <template name="fCPTchild">
     <block wx:if="{{isLiteral}}">
          {{v}}
     </block>
     <block wx:elif="{{isCPT'}}">
         <fCPT diuu='xx'/>
     </block>
 </template>
 *
 * @param ast
 * @param info
 * @returns {*}
 */
export default function childrenToTemplate(ast, info) {
    const goForCTNP = geneOrder()
    const goForCTDK = geneOrder()

    errorLogTraverse(ast, {

        exit: path => {

            if (path.type === 'JSXElement'
                && !isChildComp(path.node.openingElement.name.name)
            ) {
                const children = path.node.children
                let tempName = null//`${ChildTemplateNamePrefix}${goForCTNP.next}`

                path.node.children = children.map(ele => {
                    if (ele.type === 'JSXExpressionContainer') {

                        if (!tempName) {
                            tempName = `${ChildTemplateNamePrefix}${goForCTNP.next}`
                        }

                        const datakey = `${ChildTemplateDataKeyPrefix}${goForCTDK.next}`


                        const templateAttris = [
                            t.jsxAttribute(t.jsxIdentifier('datakey'), t.stringLiteral(datakey)),
                            t.jsxAttribute(t.jsxIdentifier('tempVnode'), ele),
                            t.jsxAttribute(t.jsxIdentifier('wx:if'), t.stringLiteral(`{{${datakey}}} !== undefined`)),
                            t.jsxAttribute(t.jsxIdentifier('is'), t.stringLiteral(tempName)),
                            t.jsxAttribute(t.jsxIdentifier('data'), t.stringLiteral(`{{d: ${datakey}}}`))
                        ]

                        if (isTextElement(path.node.openingElement)) {
                            templateAttris.push(t.jsxAttribute(t.jsxIdentifier('isTextElement')))
                        }

                        return t.jsxElement(
                            t.jsxOpeningElement(
                                t.jsxIdentifier('template'),
                                templateAttris
                            ),
                            t.jsxClosingElement(
                                t.jsxIdentifier('template')
                            ),
                            [],
                            true
                        )
                    }
                    return ele
                })

                if (tempName) {
                    info.childTemplates.push(tempName)
                }
            }

        }

    })

    return ast
}


