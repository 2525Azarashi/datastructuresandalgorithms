// 講義を追加するには: lectures/lecNN.js を作り、ここに import して LECTURES に追加するだけ。
import lec1 from './lec01.js'
import lec2 from './lec02.js'
import lec3 from './lec03.js'
import lec4 from './lec04.js'
import lec5 from './lec05.js'

export const LECTURES = [lec1, lec2, lec3, lec4, lec5]

// 講義資料がまだ届いていない回（目次のプレースホルダ）
export const UPCOMING = [
  { n: 6, title: '次回の講義資料を追加すると、ここに展開されます' },
]
