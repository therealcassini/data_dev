-- 插入宗教场所相关API数据
INSERT INTO team_api (
  module, 
  top_module, 
  sub_module, 
  developer, 
  progress, 
  content, 
  url, 
  remark
) VALUES 
-- 阿坝州重点宗教场所
('分析研判', '重要场所', '阿坝州重点宗教场所-重点宗教场所列表', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-318315888', '/api/globalSituation/keyTemplePlaceList', '接口ID：318315888'),
('分析研判', '重要场所', '阿坝州重点宗教场所-常住场所流动场所统计', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-318322577', '/api/analyzeJudge/getTempleResidenceStat', '接口ID：318322577'),
('分析研判', '重要场所', '阿坝州重点宗教场所-建筑列表', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-318324158', '/api/temple/templeBuildingStat', '接口ID：318324158'),
('分析研判', '重要场所', '阿坝州重点宗教场所-寺内摄像头', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-318324471', '/api/camera/queryCameraList', '接口ID：318324471'),
-- 宗教场所情况
('分析研判', '重要场所', '宗教场所情况-宗教场所情况统计', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317796195', '/api/analyzeJudge/religionPlaceStat', '接口ID：317796195'),
('分析研判', '重要场所', '宗教场所情况-宗教活动统计信息', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-319627174', '/api/analyzeJudge/getReligionActivityStat', '接口ID：319627174'),
('分析研判', '重要场所', '宗教场所情况-获取宗教活动列表', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-319628267', '/api/analyzeJudge/getReligionActivityList', '接口ID：319628267'),
('分析研判', '重要场所', '宗教场所情况-宗教僧侣重点统计信息', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-320805178', '/analyzeJudge/getReligionClergyStatStat', '接口ID：320805178'),
('分析研判', '重要场所', '宗教场所情况-寺庙列表分页', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317843674', '/api/analyzeJudge/templePage', '接口ID：317843674'),
('分析研判', '重要场所', '宗教场所情况-寺庙详情', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-318308492', '/api/analyzeJudge/templeDetail', '接口ID：318308492'),
('分析研判', '重要场所', '宗教场所情况-常住场所流动场所统计', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317897161', '/api/analyzeJudge/getTempleResidenceStat', '接口ID：317897161'),
('分析研判', '重要场所', '宗教场所情况-建筑列表', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317899794', '/api/temple/templeBuildingStat', '接口ID：317899794'),
('分析研判', '重要场所', '宗教场所情况-寺类摄像头', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317908917', '/api/camera/queryCameraList', '接口ID：317908917'),
('分析研判', '重要场所', '宗教场所情况-寺庙网格详情', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317910521', '/api/temple/templeGridDetail', '接口ID：317910521'),
('分析研判', '重要场所', '宗教场所情况-建筑详情', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317914037', '/api/temple/getTempleBuildAndPerson', '接口ID：317914037'),
-- 宗教场所网格情况
('分析研判', '重要场所', '宗教场所网格情况-寺庙网格微网格统计', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317783618', '/api/analyzeJudge/religionPlaceGridPowerStat', '接口ID：317783618'),
('分析研判', '重要场所', '宗教场所网格情况-网格力量分页列表', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-317787655', '/api/analyzeJudge/religionPlaceGridPowerPage', '接口ID：317787655');



寺庙网格、微网格统计
  GET /api/analyzeJudge/religionPlaceGridStat
  接口ID：317779567
  接口地址：https://app.apifox.com/link/project/6280742/apis/api-317779567

INSERT INTO team_api (
  module, 
  top_module, 
  sub_module, 
  developer, 
  progress, 
  content, 
  url, 
  remark
) VALUES 
('分析研判', '重要场所', '宗教场所网格情况-寺庙网格、微网格统计', '系统管理员', '已完成', 'https://app.apifox.com/link/project/6280742/apis/api-接口ID：317779567', '/api/analyzeJudge/religionPlaceGridStat', '接口ID：317779567');