import { replaceItem } from '../utils/replaceText'
import { getSupportSkill, getSkill } from '../store/skill'
import { log } from '../utils/index'
import tagText from '../utils/tagText'

let skillDataPrms = null
let skillData = null
const ensureSkillData = async () => {
  if (!skillDataPrms) {
    skillDataPrms = getSkill()
  }
  if (!skillData) {
    skillData = await skillDataPrms
  }
}

const nameWithPlus = (list, data) => {
  if (data) {
    list.forEach((str, index) => {
      list[index] = str + data[index]
    })
  } else {
    let arr = []
    list.forEach((str, index) => {
      let rgs = str.match(/([＋+]+)$/)
      if (rgs?.[1]) {
        arr.push(rgs[1])
        list[index] = str.replace(/[＋+]+$/, '')
      } else {
        arr.push('')
      }
    })
    return arr
  }
}

const transSkill = (item, key, data = skillData) => {
  if (item?.[key]) {
    let arr = item[key].split('/')
    arr.forEach((txt, index) => {
      let plusList = nameWithPlus(arr)
      replaceItem(arr, index, data)
      nameWithPlus(arr, plusList)
    })
    let text = arr.join('/')
    if (text !== item[key]) {
      item[key] = tagText(text)
    } else {
      // log(text)
    }
  }
}

const transSupportSkill = (list, sData) => {
  list?.forEach(item => {
    transSkill(item, 'description', sData)
    transSkill(item, 'name', sData)
  })
}

const supportSkill = async (data) => {
  const sData = await getSupportSkill()
  const supportIdol = data.userSupportIdol ?? data
  transSupportSkill(supportIdol.acquiredSupportSkills, sData)
  transSupportSkill(supportIdol.supportSkills, sData)
  transSupportSkill(supportIdol.supportIdol?.supportSkills, sData)
}

const transEffects = (data) => {
  data.skillEffects?.forEach(item => {
    transSkill(item, 'effectName')
    transSkill(item, 'effectDescription')
  })
  data.rivalMemoryAppealEffects?.forEach(item => {
    transSkill(item, 'effectName')
    transSkill(item, 'effectDescription')
  })
}

const commSkill = (data, skillData, transEffect = false) => {
  if (!data) return
  transSkill(data, 'comment')
  transSkill(data, 'name')
  if (transEffect) {
    transEffects(data)
  }
  if (data.linkSkill) {
    transSkill(data.linkSkill, 'comment')
    transSkill(data.linkSkill, 'name')
    if (transEffect) {
      transEffects(data.linkSkill)
    }
  }
}

const exSkill = (data) => {
  transSkill(data, 'name')
  transSkill(data, 'description')
}

const skillPanel = (data) => {
  if (!data) return
  data.forEach(item => {
    transSkill(item, 'releaseConditions')
    transSkill(item.passiveSkills, 'comment')
    transSkill(item.passiveSkills, 'name')
    commSkill(item.skill)
    commSkill(item.concertActiveSkill)
    if (item.activeSkills) {
      item.activeSkills.forEach(skill => {
        commSkill(skill)
      })
    }
  })
}

const memoryAppeal = (data) => {
  data.forEach(item => {
    commSkill(item)
  })
}

const shortProIdol = (data, skillData, panel = false) => {
  let proIdol = data.userProduceIdol
  if (!proIdol) return
  proIdol.activeSkills?.forEach(item => {
    commSkill(item)
  })
  proIdol.passiveSkills?.forEach(item => {
    commSkill(item)
  })
  proIdol.limitBreaks?.forEach(item => {
    commSkill(item)
  })
  if (panel) {
    skillPanel(proIdol.skillPanels)
  }
}

const judegsSkill = (data) => {
  data.forEach(judge => {
    commSkill(judge.skill, skillData, true)
  })
}

const fesRivalsSkill = (data) => {
  if (!data) return
  data.forEach(rival => {
    rival.userFesDeck?.userFesDeckMembers.forEach(member => {
      member.userFesIdol.activeSkills.forEach(skill => {
        transEffects(skill)
      })
    })
    rival.userRaidDeck?.userRaidDeckMembers.forEach(member => {
      member.userFesIdol.activeSkills.forEach(skill => {
        commSkill(skill, skillData, true)
      })
    })
    rival.rival?.rivalSkills.forEach(skill => {
      transEffects(skill)
    })
  })
}

const audRivalsSkill = (data) => {
  data.forEach(rival => {
    transEffects(rival.rivalMemoryAppeal)
    rival.rivalSkills.forEach(skill => {
      transEffects(skill)
    })
  })
}

// ==================================================
// request entry
const userIdolsSkill = async (data) => {
  await ensureSkillData()
  skillPanel(data.idol.skillPanels)
  memoryAppeal(data.idol.memoryAppeals)
  data.userIdolProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
}

const userProIdolsSkill = async (data) => {
  await ensureSkillData()
  data.activeSkills.forEach(item => {
    commSkill(item)
  })
  memoryAppeal(data.userIdol.idol.memoryAppeals)
  data.userProduceIdolProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
}

const reserveUserIdolsSkill = async (data) => {
  await ensureSkillData()
  skillPanel(data.idol.skillPanels)
  memoryAppeal(data.idol.memoryAppeals)
}

const userSptIdolsSkill = async (data) => {
  await ensureSkillData()
  skillPanel(data.supportIdol.skillPanels)
  data.userSupportIdolProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
  try {
    data.supportIdol.supportIdolActiveSkill.activeSkills.forEach(item => {
      transSkill(item, 'comment')
      transSkill(item, 'name')
    })
  } catch (e) {}
}

const userProSptIdolsSkill = async (data) => {
  await ensureSkillData()
  skillPanel(data.skillPanels)
  data.userProduceSupportIdolProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
  try {
    data.userSupportIdol.supportIdol.supportIdolActiveSkill.activeSkills.forEach(item => {
      transSkill(item, 'comment')
      transSkill(item, 'name')
    })
  } catch (e) {}
}

const reserveUserSptIdolsSkill = async (data) => {
  await ensureSkillData()
  skillPanel(data.supportIdol.skillPanels)
  try {
    data.supportIdol.supportIdolActiveSkill.activeSkills.forEach(item => {
      transSkill(item, 'comment')
      transSkill(item, 'name')
    })
  } catch (e) {}
}

const userFesIdolsSkill = async (data) => {
  await ensureSkillData()
  const fesIdol = data.userFesIdol
  fesIdol.activeSkills.forEach(item => {
    commSkill(item)
  })
  commSkill(fesIdol.memoryAppeal)
  fesIdol.passiveSkills.forEach(item => {
    transSkill(item, 'comment')
    transSkill(item, 'name')
  })
  fesIdol.userFesIdolProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
  fesIdol.userFesSupportIdols.forEach(sptIdol => {
    sptIdol.userFesSupportIdolProduceExSkills.forEach(item => {
      exSkill(item.produceExSkill)
    })
  })
}

const otherFesIdolSkill = userFesIdolsSkill

const produceExSkillTop = async (data) => {
  await ensureSkillData()
  data.userProduceExSkills.forEach(item => {
    exSkill(item.produceExSkill)
  })
}

const userFesDeck = async (data) => {
  await ensureSkillData()
  data.userFesDecks.forEach(deck => {
    deck.userFesDeckMembers.forEach(member => {
      member.userFesIdol?.activeSkills.forEach(item => {
        commSkill(item)
      })
    })
  })
}

const userRaidDeck = async (data) => {
  await ensureSkillData()
  data.userRaidDecks.forEach(deck => {
    deck.userRaidDeckMembers.forEach(member => {
      member.userFesIdol?.activeSkills.forEach(item => {
        commSkill(item)
      })
    })
  })
}

const proSkillPanels = async (data) => {
  await ensureSkillData()
  data.userProduceSupportIdols.forEach(item => {
    skillPanel(item.skillPanels)
  })
  shortProIdol(data, skillData, true)
  data.userProduceLimitedSkills?.forEach(item => {
    commSkill(item.passiveSkills)
    commSkill(item.skill)
  })
  try {
    skillPanel(data.userProduceIdol.userIdol.idol.skillPanels)
  } catch (e) {}
}

const produceFinish = async (data) => {
  if (data.gameData) return
  await ensureSkillData()
  shortProIdol(data)
}

const fesMatchConcertSkill = async (data) => {
  await ensureSkillData()
  const transDeckMember = (member) => {
    member.userFesIdol.activeSkills.forEach(item => {
      commSkill(item, skillData, true)
    })
    commSkill(member.userFesIdol.memoryAppeal, skillData, true)
    member.userFesIdol.passiveSkills.forEach(item => {
      transSkill(item, 'comment')
      transSkill(item, 'name')
      transEffects(item)
    })
  }
  data.userFesDeck?.userFesDeckMembers.forEach(transDeckMember)
  data.userRaidDeck?.userRaidDeckMembers.forEach(transDeckMember)
  judegsSkill(data.judges)
  fesRivalsSkill(data.userFesRivals)
  fesRivalsSkill(data.userFesRaidRivals)
}

const auditionSkill = async (data) => {
  await ensureSkillData()
  data.userProduceSupportIdols.forEach(item => {
    commSkill(item.activeSkill, skillData, true)
  })
  let proIdol = data.userProduceIdol
  proIdol.activeSkills.forEach(skill => {
    commSkill(skill, skillData, true)
  })
  commSkill(proIdol.memoryAppeal, skillData, true)
  proIdol.passiveSkills.forEach(skill => {
    commSkill(skill, skillData, true)
  })
  let audition = data.produceAudition || data.produceConcert
  judegsSkill(audition.judges)
  audRivalsSkill(audition.rivals)
}

const resumeGameSkill = async (data) => {
  if (!data.gameData) return
  try {
    let gData = JSON.parse(data.gameData)
    if (gData.produceAudition || gData.produceConcert) {
      await auditionSkill(gData)
    } else if (gData.userFesDeck || gData.userRaidDeck) {
      await fesMatchConcertSkill(gData)
    }
    data.gameData = JSON.stringify(gData)
  } catch (e) {
    log(e)
  }
}

const resumeRaidGameSkill = async (data) => {
  if (!data.gameState || !data.gameState.game_data) return
  try {
    let gData = JSON.parse(data.gameState.game_data)
    if (gData.userRaidDeck) {
      await fesMatchConcertSkill(gData)
    }
    data.gameState.game_data = JSON.stringify(gData)
  } catch (e) {
    log(e)
  }
}

const produceResultSkill = async (data) => {
  await ensureSkillData()
  data.produceExSkillRewards.forEach(reward => {
    exSkill(reward.produceExSkill)
  })
}

const ideaNotesSkill = async (data) => {
  if (!data.userProduceIdeaNotes) return
  await ensureSkillData()
  data.userProduceIdeaNotes.forEach(note => {
    let bonus = note.produceIdeaNote.produceIdeaNoteCompleteBonus
    transSkill(bonus, 'title')
    transSkill(bonus, 'comment')
    note.produceIdeaNote.produceIdeaNoteExtraBonuses.forEach(item => {
      transSkill(item, 'comment')
      transSkill(item, 'condition')
    })
  })
}

const noteResultSkill = async (data) => {
  await ensureSkillData()
  try {
    let item = data.lessonResult.userProduceIdeaNote.produceIdeaNote.produceIdeaNoteCompleteBonus
    commSkill(item)
  } catch (e) {}
}

const producesDecksSkill = async (data) => {
  const sData = await getSupportSkill()
  data.userSupportIdols?.forEach(item => {
    transSupportSkill(item.supportIdol?.supportSkills, sData)
  })
}

const producesActionReadySkill = async (data) => {
  const sData = await getSupportSkill()
  data.userDecks.forEach(deck => {
    deck.userSupportIdols.forEach(item => {
      transSupportSkill(item.supportIdol?.supportSkills, sData)
    })
  })
}

export {
  supportSkill, userIdolsSkill, produceExSkillTop,
  userFesIdolsSkill, userSptIdolsSkill, reserveUserIdolsSkill,
  reserveUserSptIdolsSkill, otherFesIdolSkill, userFesDeck, userRaidDeck, userProIdolsSkill,
  userProSptIdolsSkill, proSkillPanels, produceFinish, producesActionReadySkill,
  fesMatchConcertSkill, resumeGameSkill, resumeRaidGameSkill, auditionSkill, produceResultSkill,
  ideaNotesSkill, noteResultSkill, producesDecksSkill
}
