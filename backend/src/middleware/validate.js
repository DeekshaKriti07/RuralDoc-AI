module.exports = (fields) => (req,res,next) => {
 const b=req.body || {};
 for(const [key,max] of Object.entries(fields)) if(b[key] != null && (typeof b[key] !== 'string' || b[key].length>max)) return res.status(400).json({error:'Invalid '+key});
 for(const key of ['recorded_date','start_date','end_date']) if(b[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(b[key]) || Number.isNaN(Date.parse(b[key]))))return res.status(400).json({error:'Invalid date'});
 if(b.start_date && b.end_date && b.end_date<b.start_date)return res.status(400).json({error:'End date must follow start date'});
 if(b.times_per_day != null && (!Number.isInteger(Number(b.times_per_day)) || Number(b.times_per_day)<1 || Number(b.times_per_day)>24))return res.status(400).json({error:'Invalid daily frequency'});
 if(b.reminder_time && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(b.reminder_time))return res.status(400).json({error:'Invalid reminder time'});
 if(b.file_url){try{if(!['https:','http:'].includes(new URL(b.file_url).protocol))throw Error();}catch{return res.status(400).json({error:'Invalid file URL'});}}
 next();
};
